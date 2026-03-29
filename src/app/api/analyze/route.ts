import { NextRequest, NextResponse } from 'next/server'
import { StructuredAnalysis, UserType, AnalysisMode } from '@/types'

const USER_TYPE_LABELS: Record<UserType, string> = {
  new_user: '新用户（首次使用产品，不熟悉界面，需要明确的引导）',
  experienced_user: '老用户（熟悉产品，有固定使用习惯，对流程有预期）',
  high_intent_user: '高意图用户（目标非常明确，急于完成任务，容忍度低）',
}

function buildPrompt(task: string, userType: UserType, mode: AnalysisMode, imageCount: number): string {
  const persona = USER_TYPE_LABELS[userType]
  const modeDesc = mode === 'flow'
    ? `这是一个包含 ${imageCount} 个步骤的连续操作流程，图片按顺序排列。`
    : '这是单个页面的可用性分析。'

  return `你是一名资深 UX 研究员和产品分析师。

你的任务不是自由发挥写报告，而是：
基于页面截图和给定任务，输出一份结构化、可决策的可用性分析结果。

请严格遵循以下分析目标：
- 识别用户完成任务时的关键路径
- 找出真正的问题点，而不是泛泛描述页面
- 区分"找不到""看不懂""不知道该不该选""布局问题"
- 不要默认所有问题都是高风险
- 不要重复表达同一个问题
- 不要在问题模块里写解决方案
- 不要在优先级模块里重复问题描述
- 不要在方案模块里重复分析原因

任务：${task}
用户类型：${persona}
分析模式：${modeDesc}

---

风险判断规则（severity 必须基于以下字段推导）：
- isCriticalPath：是否发生在关键路径
- blocksUser：是否阻断用户继续操作
- recoverable：是否容易恢复
- high：isCriticalPath=true 且 blocksUser=true，或严重违背认知且 recoverable=false
- medium：造成困惑或多余步骤，但不阻断流程
- low：轻微问题，不影响任务完成

问题类型规则（type 只能从以下 4 个中选一个）：
- discoverability：用户没看到/找不到入口
- comprehension：用户看到了，但不理解含义
- decision：用户理解了，但不确定该不该选
- layout：布局、层级、位置导致路径不顺或误操作

去重规则：
- summary 只给结论，不给详细分析
- flow 只描述步骤和状态，不解释原因
- issues 只分析问题，不写解决方案
- priorities 只做排序判断，不重复分析内容
- solutions 只写怎么改，不重复问题描述

输出要求：
- 必须输出 JSON，不要输出 markdown，不要输出代码块，不要输出解释性文字
- 不要输出多余字段，不要使用 null，尽量填具体内容
- 严格按以下格式输出，不得增加其他顶层字段

输出示例（严格按此结构，替换为真实分析内容）：

{
  "summary": {
    "level": "high",
    "coreIssue": "一句话总结最大问题",
    "confidence": 0.82,
    "reasons": [
      "原因1",
      "原因2"
    ]
  },
  "flow": [
    {
      "step": 1,
      "action": "用户执行的动作",
      "status": "ok",
      "note": "该步骤说明"
    },
    {
      "step": 2,
      "action": "用户执行的动作",
      "status": "friction",
      "note": "此处出现犹豫或卡顿"
    }
  ],
  "issues": [
    {
      "id": "ISSUE_1",
      "title": "问题标题",
      "type": "comprehension",
      "isCriticalPath": true,
      "blocksUser": true,
      "recoverable": false,
      "reasoning": {
        "observation": "观察到的现象",
        "userExpectation": "用户原本预期",
        "actualExperience": "页面实际呈现",
        "cognitiveGap": "预期和现实的差异",
        "userThinking": "用户可能的心理活动",
        "evidence": "支持判断的证据"
      },
      "impact": {
        "scope": "high",
        "businessImpact": "会影响流程完成率或转化"
      },
      "severity": "high"
    }
  ],
  "priorities": [
    {
      "issueId": "ISSUE_1",
      "priority": "P0",
      "reason": "发生在关键路径且会阻断任务"
    }
  ],
  "solutions": [
    {
      "issueId": "ISSUE_1",
      "level": "P0",
      "solution": "具体改法",
      "type": "cognition",
      "expectedEffect": "预期会降低理解成本并提升完成率"
    }
  ]
}`
}

const MODELS = [
  'google/gemma-3-27b-it:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
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
        temperature: 0.3,
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

    // 依次尝试所有模型，遇到 429/502/503 自动切换
    const orderedModels = [MODEL, ...MODELS.filter(m => m !== MODEL)]
    let res: Response = await makeRequest(orderedModels[0])
    for (let i = 1; i < orderedModels.length; i++) {
      if (res.status === 429 || res.status === 502 || res.status === 503) {
        res = await makeRequest(orderedModels[i])
      } else {
        break
      }
    }

    if (!res.ok) {
      const err = await res.text()
      if (res.status === 429) return NextResponse.json({ error: '所有模型请求频繁，请稍后重试' }, { status: 429 })
      if (res.status === 502 || res.status === 503) return NextResponse.json({ error: '模型服务暂时不可用，请稍后重试' }, { status: 502 })
      return NextResponse.json({ error: `API 错误: ${res.status} ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''

    // 提取 JSON
    let jsonStr = text
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) jsonStr = fenceMatch[1]
    else {
      const objMatch = text.match(/\{[\s\S]*\}/)
      if (!objMatch) return NextResponse.json({ error: 'AI 返回格式异常，请重试' }, { status: 500 })
      jsonStr = objMatch[0]
    }

    jsonStr = jsonStr
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([}\]"0-9])\s*\n\s*(["{[])/g, '$1,\n$2')

    let result: StructuredAnalysis
    try {
      result = JSON.parse(jsonStr)
    } catch {
      const lastBrace = jsonStr.lastIndexOf('}')
      if (lastBrace === -1) return NextResponse.json({ error: 'AI 返回格式异常，请重试' }, { status: 500 })
      try {
        result = JSON.parse(jsonStr.slice(0, lastBrace + 1))
      } catch {
        return NextResponse.json({ error: 'AI 返回格式异常，请重试' }, { status: 500 })
      }
    }

    // 补全 pageAnalyses（供可视化面板使用，AI 不再输出）
    result.pageAnalyses = imageFiles.map((_, idx) => ({
      stepIndex: idx,
      stepName: stepNames[idx] || `页面${idx + 1}`,
      annotations: [],
      operationPath: [],
    }))

    // 兜底：确保关键字段存在
    if (!result.summary) result.summary = { level: 'medium', coreIssue: '', confidence: 0.5, reasons: [] }
    if (!result.summary.level) result.summary.level = 'medium'
    if (!(['high', 'medium', 'low'] as const).includes(result.summary.level)) result.summary.level = 'medium'
    if (!result.issues) result.issues = []
    if (!result.flow) result.flow = []
    if (!result.priorities) result.priorities = []
    if (!result.solutions) result.solutions = []

    // 清理 emoji
    const stripEmoji = (str: string) =>
      str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/\s{2,}/g, ' ').trim()

    result.issues = result.issues?.map(issue => ({
      ...issue,
      title: stripEmoji(issue.title),
    })) ?? []
    result.solutions = result.solutions?.map(sol => ({
      ...sol,
      options: sol.options?.map(o => ({ ...o, action: stripEmoji(o.action) })) ?? [],
    })) ?? []

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '分析失败，请重试'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
