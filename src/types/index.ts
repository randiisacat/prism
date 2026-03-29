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
export type IssueType = 'discoverability' | 'comprehension' | 'decision' | 'layout'

export interface TaskConfig {
  task: string
  userType: UserType
  mode: AnalysisMode
}

// ─── Visualization ────────────────────────────────────────────────────────────
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

// ─── Structured Analysis ──────────────────────────────────────────────────────
export interface AnalysisSummary {
  level: RiskLevel
  coreIssue: string
  confidence: number
  reasons: string[]
}

export interface FlowStep {
  step: number
  action: string
  status: 'ok' | 'friction' | 'blocked'
  note: string
}

export interface IssueReasoning {
  observation: string
  userExpectation: string
  actualExperience: string
  cognitiveGap: string
  userThinking: string
  evidence: string
}

export interface IssueImpact {
  scope: RiskLevel
  businessImpact: string
}

export interface Issue {
  id: string
  title: string
  type: IssueType
  isCriticalPath: boolean
  blocksUser: boolean
  recoverable: boolean
  reasoning: IssueReasoning
  impact: IssueImpact
  severity: RiskLevel
}

export interface IssuePriority {
  issueId: string
  priority: 'P0' | 'P1' | 'P2'
  reason: string
}

export interface Solution {
  issueId: string
  level: 'P0' | 'P1' | 'P2'
  solution: string
  type: 'structure' | 'cognition' | 'ui'
  expectedEffect: string
}

export interface StructuredAnalysis {
  summary: AnalysisSummary
  flow: FlowStep[]
  issues: Issue[]
  priorities: IssuePriority[]
  solutions: Solution[]
  pageAnalyses: PageAnalysis[]
}
