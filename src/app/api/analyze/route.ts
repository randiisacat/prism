import { NextRequest, NextResponse } from 'next/server'
import { AnalysisResult, UserType, AnalysisMode } from '@/types'

const USER_TYPE_LABELS: Record<UserType, string> = {
  new_user: '新用户（首次使用产品，不熟悉界面，需要明确的引导）',
  experienced_user: '老用户（熟悉产品，有固定使用习惯，对流程有预期）',
  high_intent_user: '高意图用户（目标非常明确，急于完成任务，容忍度低）',
}

function buildPrompt(task: string, userType: UserType, mode: AnalysisMode, imageCount: number): string {
  const userDesc = USER_TYPE_LABELS[userType]
  const modeDesc = mode === 'flow'
    ? `这是一个包含 ${imageCount} 个步骤的连续操作流程，图片按顺序排列，用户需要依次完成每个步骤。`
    : '这是单个页面的可用性分析。'

  return `你是一位专业的用户体验研究员，同时也是一位${userDesc}。

任务目标：${task}
分析模式：${modeDesc}

请基于截图，严格以"${userDesc}"的视角模拟用户完成任务的过程，输出结构化分析结果。

**重要要求：**
- 必须站在真实用户视角，而非UI专家视角
- 关注用户的认知过程，而非界面的技术实现
- 对于多图流程，必须判断用户在哪个步骤最容易卡住或流失
- 可视化标注坐标使用百分比（0-100），表示元素在图片中的相对位置

请以严格的 JSON 格式输出，不要包含任何多余文字：

{
  "summary": "一句话结论，描述当前流程是否顺畅以及主要问题",
  "firstReaction": "用户第一眼的真实反应，是否清楚下一步该做什么",
  "operationPath": [
    "步骤1：用户先看哪里/做什么",
    "步骤2：接下来的动作",
    "步骤3：..."
  ],
  "blockingPoints": [
    {
      "title": "问题标题",
      "description": "具体描述这个卡点",
      "reason": "用户为什么会在这里困惑",
      "impact": "对任务完成的影响",
      "severity": "high|medium|low"
    }
  ],
  "dropoffRisk": {
    "step": "最可能放弃的步骤名称（如：Step 2 注册页）",
    "reason": "用户在这里放弃的原因"
  },
  "suggestions": [
    "针对问题1的具体优化建议",
    "针对问题2的具体优化建议"
  ],
  "riskLevel": "high|medium|low",
  "pageAnalyses": [
    {
      "stepIndex": 0,
      "stepName": "页面名称",
      "annotations": [
        {
          "type": "attention",
          "x": 50,
          "y": 20,
          "width": 30,
          "height": 10,
          "label": "用户首先注意到这里"
        },
        {
          "type": "action",
          "x": 40,
          "y": 60,
          "width": 20,
          "height": 8,
          "label": "用户会尝试点击此处"
        },
        {
          "type": "confusion",
          "x": 10,
          "y": 80,
          "width": 25,
          "height": 10,
          "label": "这里容易产生困惑"
        }
      ],
      "operationPath": ["先看标题", "然后寻找按钮", "点击操作"]
    }
  ]
}`
}

const MODEL = 'google/gemini-2.0-flash-exp:free'
const API_BASE = 'https://openrouter.ai/api/v1'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const apiKey = process.env.OPENROUTER_API_KEY
    const task = formData.get('task') as string
    const userType = formData.get('userType') as UserType
    const mode = formData.get('mode') as AnalysisMode
    const stepNames = JSON.parse(formData.get('stepNames') as string) as string[]

    if (!apiKey) return NextResponse.json({ error: '服务未配置，请联系管理员' }, { status: 500 })
    if (!task) return NextResponse.json({ error: '请输入用户任务' }, { status: 400 })

    const imageFiles: File[] = []
    let i = 0
    while (formData.get(`image_${i}`)) {
      imageFiles.push(formData.get(`image_${i}`) as File)
      i++
    }

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: '请上传至少一张截图' }, { status: 400 })
    }

    const imageParts = await Promise.all(
      imageFiles.map(async (file, idx) => {
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        return [
          { type: 'text', text: `\n--- Step ${idx + 1}: ${stepNames[idx] || `页面${idx + 1}`} ---\n` },
          { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
        ]
      })
    )

    const prompt = buildPrompt(task, userType, mode, imageFiles.length)

    const body = {
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageParts.flat(),
          ],
        },
      ],
      temperature: 0.4,
    }

    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://prism-simuser.vercel.app',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      if (res.status === 429) return NextResponse.json({ error: '请求过于频繁，请稍后重试' }, { status: 429 })
      if (res.status === 404) return NextResponse.json({ error: '模型不可用，请联系管理员' }, { status: 500 })
      return NextResponse.json({ error: `API 错误: ${res.status} ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 返回格式异常，请重试' }, { status: 500 })
    }

    const analysisResult: AnalysisResult = JSON.parse(jsonMatch[0])

    if (analysisResult.pageAnalyses && analysisResult.pageAnalyses.length < imageFiles.length) {
      while (analysisResult.pageAnalyses.length < imageFiles.length) {
        analysisResult.pageAnalyses.push({
          stepIndex: analysisResult.pageAnalyses.length,
          stepName: stepNames[analysisResult.pageAnalyses.length] || `页面${analysisResult.pageAnalyses.length + 1}`,
          annotations: [],
          operationPath: [],
        })
      }
    }

    return NextResponse.json(analysisResult)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '分析失败，请重试'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
