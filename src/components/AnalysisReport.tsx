'use client'

import { AnalysisResult, RiskLevel } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, Lightbulb, AlertCircle } from 'lucide-react'

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  high: {
    label: '高风险',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: <XCircle className="w-5 h-5 text-red-500" />,
  },
  medium: {
    label: '中风险',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  },
  low: {
    label: '低风险',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  },
}

const SEVERITY_BADGE: Record<RiskLevel, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-orange-100 text-orange-700 border-orange-200',
  low: 'bg-green-100 text-green-700 border-green-200',
}

interface AnalysisReportProps {
  result: AnalysisResult
}

export function AnalysisReport({ result }: AnalysisReportProps) {
  const riskConfig = RISK_CONFIG[result.riskLevel]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">结论报告</h2>

      {/* Summary card */}
      <div className={`rounded-xl border-2 p-4 ${riskConfig.bg}`}>
        <div className="flex items-start gap-3">
          {riskConfig.icon}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-bold text-sm ${riskConfig.color}`}>{riskConfig.label}</span>
            </div>
            <p className="text-sm font-medium text-foreground">{result.summary}</p>
          </div>
        </div>
      </div>

      {/* First reaction */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
          用户第一反应
        </h3>
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
          {result.firstReaction}
        </p>
      </div>

      <Separator />

      {/* Operation path */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">2</span>
          预期操作路径
        </h3>
        <div className="space-y-1">
          {result.operationPath.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Blocking points */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">3</span>
          关键阻塞点 Top {result.blockingPoints.length}
        </h3>
        <div className="space-y-3">
          {result.blockingPoints.map((point, idx) => (
            <div key={idx} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium">{point.title}</span>
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_BADGE[point.severity]}`}>
                  {RISK_CONFIG[point.severity].label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{point.description}</p>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">原因：</span>
                  <span>{point.reason}</span>
                </div>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">影响：</span>
                <span>{point.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Dropoff risk */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">4</span>
          最可能流失步骤
        </h3>
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium text-red-700">{result.dropoffRisk.step}</span>
          </div>
          <p className="text-xs text-red-600 pl-6">{result.dropoffRisk.reason}</p>
        </div>
      </div>

      <Separator />

      {/* Suggestions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">5</span>
          优化建议
        </h3>
        <div className="space-y-2">
          {result.suggestions.map((suggestion, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        ⚠️ 本报告基于页面视觉与通用认知习惯模拟生成，不等同于真实用户测试结果，仅供参考。
      </div>
    </div>
  )
}
