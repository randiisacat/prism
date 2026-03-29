export interface UploadedImage {
  id: string
  file: File
  previewUrl: string
  stepName: string
  order: number
}

export type UserType = 'new_user' | 'experienced_user' | 'high_intent_user'
export type AnalysisMode = 'single' | 'flow'
export type RiskLevel = 'high' | 'medium' | 'low'
export type Priority = 'P0' | 'P1' | 'P2'

export interface TaskConfig {
  task: string
  userType: UserType
  mode: AnalysisMode
}

export interface AnnotationRegion {
  type: 'attention' | 'action' | 'confusion'
  x: number
  y: number
  width: number
  height: number
  label: string
}

export interface PageAnalysis {
  stepIndex: number
  stepName: string
  annotations: AnnotationRegion[]
  operationPath: string[]
}

export interface SuggestionOption {
  cost: 'low' | 'medium' | 'high'
  costLabel: string
  action: string
}

export interface BlockingPoint {
  title: string
  description: string
  reason: string
  impact: string
  severity: RiskLevel
  priority: Priority
  mentalModel: string        // 用户心理模型
  businessImpact: string     // 业务影响
  riskBasis: string          // 风险判断依据
  newUserImpact: string      // 新用户影响
  experiencedUserImpact: string // 老用户影响
  suggestions: SuggestionOption[] // 多方案建议
}

export interface AnalysisResult {
  summary: string
  firstReaction: string
  operationPath: string[]
  blockingPoints: BlockingPoint[]
  dropoffRisk: {
    step: string
    reason: string
  }
  suggestions: string[]
  cognitionModel?: {
    assumption: string
    reality: string
    result: string
  }
  riskLevel: RiskLevel
  pageAnalyses: PageAnalysis[]
}
