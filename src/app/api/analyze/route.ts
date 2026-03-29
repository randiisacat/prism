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

  return `你是一位专业的用户体验研究员和产品决策顾问，同时也是一位${userDesc}。

任务目标：${task}
分析模式：${modeDesc}

请基于截图，严格以"${userDesc}"的视角模拟用户完成任务的过程，输出结构化分析结果。

**重要要求：**
- 必须站在真实用户视角，而非UI专家视角
- 关注用户的认知过程，而非界面的技术实现
- 对于多图流程，必须判断用户在哪个步骤最容易卡住或流失
- 可视化标注坐标使用百分比（0-100），表示元素在图片中的相对位置
- blockingPoints 必须按优先级排序（P0 最严重），最多输出 3 个
- 每个 blockingPoint 必须包含心理模型分析、业务影响判断、风险依据、用户类型差异和三档建议方案

请以严格的 JSON 格式输出，不要包含任何多余文字：

{
  "summary": "【必须】15字以内的一句话结论，直接指出最核心问题，不加修饰语，例如：用户在支付页产生认知困惑",
  "firstReaction": "【必须】20字以内，说明原因，例如：选项描述不清，按钮位置不直观",
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
      "impact": "用户会因此产生什么具体行为后果，例如：用户不敢点击发送（流程中断）、用户反复返回重试（体验崩溃）",
      "severity": "high|medium|low",
      "priority": "P0|P1|P2",
      "mentalModel": "用户对这个界面元素的心理预期是什么，为什么会产生误解",
      "businessImpact": "这个问题对转化率/完成率/用户留存的具体影响",
      "riskBasis": "判断为该风险等级的依据，例如：认知摩擦大、流程断裂、信息缺失等",
      "newUserImpact": "对新用户的具体影响",
      "experiencedUserImpact": "对老用户的具体影响",
      "suggestions": [
        { "cost": "low", "costLabel": "低成本", "action": "不改界面结构，仅改文案/颜色/顺序即可解决" },
        { "cost": "medium", "costLabel": "中成本", "action": "需调整局部 UI 布局或交互逻辑" },
        { "cost": "high", "costLabel": "高成本", "action": "需重新设计该模块或流程" }
      ]
    }
  ],
  "dropoffRisk": {
    "step": "最可能放弃的步骤名称（如：Step 3 View Once）",
    "reason": "两句话，用"|"分隔，每句描述一个用户行为后果，例如：用户不确定是否安全发送|可能直接放弃操作"
  },
  "suggestions": [
    "针对问题1的具体优化建议",
    "针对问题2的具体优化建议"
  ],
  "cognitionModel": {
    "assumption": "用户默认认为什么（一句话，描述用户的心理预期）",
    "reality": "实际界面打破了这个预期（一句话，说明哪里不符合预期）",
    "result": "导致用户产生什么行为（一句话，描述用户的反应或结果）"
  },
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

const MODELS = [
  'google/gemma-3-27b-it:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'meta-llama/llama-3.3-70b-instruct:free',
]
const MODEL = MODELS[Math.floor(Math.random() * MODELS.length)]
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

    const makeRequest = async (model: string) => {
      const body = {
        model,
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
      return fetch(`${API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://prism-simuser.vercel.app',
        },
        body: JSON.stringify(body),
      })
    }

    let res = await makeRequest(MODEL)

    // 429 时自动换下一个模型重试一次
    if (res.status === 429) {
      const fallback = MODELS.find(m => m !== MODEL) ?? MODELS[0]
      res = await makeRequest(fallback)
    }

    if (!res.ok) {
      const err = await res.text()
      if (res.status === 429) return NextResponse.json({ error: '所有模型请求频繁，请稍后重试' }, { status: 429 })
      return NextResponse.json({ error: `API 错误: ${res.status} ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''

    // 提取 JSON，清理常见问题：markdown 代码块、控制字符、尾随逗号
    let jsonStr = text
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) jsonStr = fenceMatch[1]
    else {
      const objMatch = text.match(/\{[\s\S]*\}/)
      if (!objMatch) return NextResponse.json({ error: 'AI 返回格式异常，请重试' }, { status: 500 })
      jsonStr = objMatch[0]
    }
    // 清理控制字符和尾随逗号
    jsonStr = jsonStr
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/,\s*([}\]])/g, '$1')

    const analysisResult: AnalysisResult = JSON.parse(jsonStr)

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
