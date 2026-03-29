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

export interface BlockingPoint {
  title: string
  description: string
  reason: string
  impact: string
  severity: RiskLevel
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
  riskLevel: RiskLevel
  pageAnalyses: PageAnalysis[]
}
