'use client'

import { useState } from 'react'
import { StructuredAnalysis, RiskLevel, IssueType, Issue, IssuePriority, Solution } from '@/types'
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, ArrowDown, Zap, Eye, HelpCircle, GitBranch, Layout, ShieldAlert } from 'lucide-react'

const RISK_CONFIG: Record<RiskLevel, {
  label: string
  textColor: string
  bgColor: string
  borderColor: string
  barColor: string
  icon: React.ReactNode
}> = {
  high: {
    label: '高风险',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    barColor: 'bg-red-500',
    icon: <XCircle className="w-4 h-4" />,
  },
  medium: {
    label: '中风险',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    barColor: 'bg-orange-400',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  low: {
    label: '低风险',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    barColor: 'bg-blue-400',
    icon: <CheckCircle className="w-4 h-4" />,
  },
}

const ISSUE_TYPE_CONFIG: Record<IssueType, { label: string; icon: React.ReactNode; color: string }> = {
  discoverability: { label: '找不到', icon: <Eye className="w-3 h-3" />, color: 'bg-purple-100 text-purple-600' },
  comprehension:   { label: '看不懂', icon: <HelpCircle className="w-3 h-3" />, color: 'bg-orange-100 text-orange-600' },
  decision:        { label: '不确定', icon: <GitBranch className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700' },
  layout:          { label: '布局问题', icon: <Layout className="w-3 h-3" />, color: 'bg-slate-100 text-slate-600' },
}

const PRIORITY_STYLE: Record<string, string> = {
  P0: 'bg-red-500 text-white',
  P1: 'bg-orange-400 text-white',
  P2: 'bg-slate-200 text-slate-600',
}

const SOLUTION_TYPE_STYLE: Record<string, { label: string; color: string }> = {
  structure: { label: '结构改造', color: 'bg-purple-100 text-purple-700' },
  cognition: { label: '认知优化', color: 'bg-blue-100 text-blue-700' },
  ui:        { label: 'UI 调整', color: 'bg-emerald-100 text-emerald-700' },
}

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; textColor: string; bgColor: string; borderColor: string }> = {
  ok:       { label: '顺畅', dotColor: 'bg-emerald-400', textColor: 'text-slate-700', bgColor: 'bg-slate-50', borderColor: 'border-transparent' },
  friction: { label: '犹豫', dotColor: 'bg-orange-400', textColor: 'text-orange-800', bgColor: 'bg-orange-50', borderColor: 'border-orange-100' },
  blocked:  { label: '卡住', dotColor: 'bg-red-500', textColor: 'text-red-800', bgColor: 'bg-red-50', borderColor: 'border-red-100' },
}

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${color ?? 'text-slate-400'}`}>
      {children}
    </p>
  )
}

// ─── Issue Card ───────────────────────────────────────────────────────────────
function IssueCard({ issue, priority, solution, index }: {
  issue: Issue
  priority?: IssuePriority
  solution?: Solution
  index: number
}) {
  const [expanded, setExpanded] = useState(index === 0)
  const sev = RISK_CONFIG[issue.severity] ?? RISK_CONFIG.medium
  const typeConfig = ISSUE_TYPE_CONFIG[issue.type] ?? ISSUE_TYPE_CONFIG.comprehension
  const pLabel = priority?.priority ?? (index === 0 ? 'P0' : index === 1 ? 'P1' : 'P2')
  const solTypeConfig = solution ? (SOLUTION_TYPE_STYLE[solution.type] ?? SOLUTION_TYPE_STYLE.ui) : null

  return (
    <div className="rounded-xl overflow-hidden border border-slate-100">
      <div className="flex">
        <div className={`w-1 flex-shrink-0 ${sev.barColor}`} />
        <div className="flex-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left px-4 py-3 flex items-center gap-2"
          >
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${PRIORITY_STYLE[pLabel] ?? PRIORITY_STYLE.P2}`}>
              {pLabel}
            </span>
            <span className="text-[13px] font-semibold text-slate-800 flex-1 leading-snug">{issue.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${typeConfig.color}`}>
              {typeConfig.icon}{typeConfig.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
              issue.severity === 'high'   ? 'bg-red-100 text-red-600' :
              issue.severity === 'medium' ? 'bg-orange-100 text-orange-500' :
                                            'bg-slate-100 text-slate-500'
            }`}>{sev.label}</span>
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            }
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">

              {/* 风险因子徽章 */}
              <div className="flex gap-1.5 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${issue.isCriticalPath ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                  {issue.isCriticalPath ? '关键路径' : '非关键路径'}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${issue.blocksUser ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                  {issue.blocksUser ? '阻断操作' : '不阻断'}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${issue.recoverable ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                  {issue.recoverable ? '可恢复' : '难恢复'}
                </span>
              </div>

              {/* 认知分析 */}
              <div className="space-y-1.5">
                {issue.reasoning.observation && (
                  <div className="flex gap-2 items-baseline">
                    <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 w-14">观察</span>
                    <p className="text-[12px] text-slate-600 leading-relaxed flex-1">{issue.reasoning.observation}</p>
                  </div>
                )}
                <div className="flex gap-2 items-baseline">
                  <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 w-14">用户预期</span>
                  <p className="text-[12px] text-slate-600 leading-relaxed flex-1">{issue.reasoning.userExpectation}</p>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 w-14">实际看到</span>
                  <p className="text-[12px] text-slate-600 leading-relaxed flex-1">{issue.reasoning.actualExperience}</p>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="text-[10px] font-bold text-orange-400 flex-shrink-0 w-14">认知差距</span>
                  <p className="text-[12px] text-slate-700 font-medium leading-relaxed flex-1">{issue.reasoning.cognitiveGap}</p>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="text-[10px] font-bold text-blue-400 flex-shrink-0 w-14">用户心想</span>
                  <p className="text-[12px] text-slate-600 leading-relaxed flex-1 italic">{issue.reasoning.userThinking}</p>
                </div>
                {issue.reasoning.evidence && (
                  <div className="flex gap-2 items-baseline">
                    <span className="text-[10px] font-bold text-slate-300 flex-shrink-0 w-14">证据</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed flex-1">{issue.reasoning.evidence}</p>
                  </div>
                )}
              </div>

              {/* 业务影响 */}
              {issue.impact?.businessImpact && (
                <div className="flex gap-2 items-start bg-slate-50 rounded-lg px-3 py-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-slate-600 leading-relaxed">{issue.impact.businessImpact}</p>
                </div>
              )}

              {/* 改进方案 */}
              {solution && (
                <div className="space-y-1.5 pt-1 border-t border-slate-50">
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">改进方案</p>
                    {solTypeConfig && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${solTypeConfig.color}`}>
                        {solTypeConfig.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-700 leading-relaxed">{solution.solution}</p>
                  {solution.expectedEffect && (
                    <p className="text-[11px] text-emerald-600">预期效果：{solution.expectedEffect}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface AnalysisReportProps {
  result: StructuredAnalysis
}

export function AnalysisReport({ result }: AnalysisReportProps) {
  const risk = RISK_CONFIG[result.summary?.level] ?? RISK_CONFIG.medium

  const priorityOrder: Record<string, number> = {}
  result.priorities?.forEach(p => {
    priorityOrder[p.issueId] = p.priority === 'P0' ? 0 : p.priority === 'P1' ? 1 : 2
  })
  const sortedIssues = [...(result.issues ?? [])].sort((a, b) => {
    const pa = priorityOrder[a.id] ?? 99
    const pb = priorityOrder[b.id] ?? 99
    if (pa !== pb) return pa - pb
    return (['high', 'medium', 'low'].indexOf(a.severity) - ['high', 'medium', 'low'].indexOf(b.severity))
  })

  const solutionMap = Object.fromEntries((result.solutions ?? []).map(s => [s.issueId, s]))
  const priorityMap = Object.fromEntries((result.priorities ?? []).map(p => [p.issueId, p]))

  const p0Issue = sortedIssues[0]
  const coreIssue = result.summary?.coreIssue ?? ''
  const confidence = result.summary?.confidence

  const blockedStep = result.flow?.find(s => s.status === 'blocked') ?? result.flow?.find(s => s.status === 'friction')

  return (
    <div className="space-y-4">

      {/* ══ 1. SUMMARY ══════════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border-2 ${risk.borderColor} ${risk.bgColor} p-5`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={risk.textColor}>{risk.icon}</span>
            <span className={`text-[11px] font-black uppercase tracking-widest ${risk.textColor}`}>{risk.label}</span>
          </div>
          {confidence !== undefined && (
            <span className="text-[10px] text-slate-400 font-medium">
              置信度 {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
        <p className={`text-[15px] font-black leading-snug ${risk.textColor} mb-2`}>
          {coreIssue.length > 24 ? coreIssue.slice(0, 24) + '…' : coreIssue}
        </p>
        {result.summary?.reasons?.length > 0 && (
          <ul className="space-y-1 border-t border-white/50 pt-2 mb-3">
            {result.summary.reasons.map((r, i) => (
              <li key={i} className="text-[12px] text-slate-500 leading-relaxed flex gap-1.5">
                <span className="text-slate-300 flex-shrink-0">·</span>{r}
              </li>
            ))}
          </ul>
        )}
        {p0Issue && (
          <div className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2">
            <Zap className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">建议立即处理</span>
            <span className="text-[12px] font-semibold text-slate-700 leading-snug">{p0Issue.title}</span>
          </div>
        )}
      </div>

      {/* ══ 2. FLOW ══════════════════════════════════════════════════════════════ */}
      {result.flow?.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <SectionLabel>操作路径</SectionLabel>
          <div className="flex flex-col">
            {result.flow.map((step, idx) => {
              const isLast = idx === result.flow.length - 1
              const sc = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.ok
              return (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold
                      ${step.status === 'blocked' ? 'bg-red-400 text-white' :
                        step.status === 'friction' ? 'bg-orange-300 text-white' :
                        'bg-slate-100 text-slate-500'}`}>
                      {step.step}
                    </div>
                    <div className={`flex-1 rounded-lg px-3 py-2 text-[12px] leading-snug border ${sc.bgColor} ${sc.borderColor}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`${sc.textColor} flex-1`}>{step.action}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dotColor}`} />
                          <span className={`text-[10px] font-bold ${sc.textColor}`}>{sc.label}</span>
                        </div>
                      </div>
                      {step.note && step.status !== 'ok' && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{step.note}</p>
                      )}
                    </div>
                  </div>
                  {!isLast && (
                    <div className="flex justify-start pl-[9px] my-0.5">
                      <ArrowDown className="w-3 h-3 text-slate-300" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ 3. ISSUES ════════════════════════════════════════════════════════════ */}
      {sortedIssues.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>问题分析 · {sortedIssues.length} 处</SectionLabel>
            <span className="text-[10px] text-slate-400 -mt-3">点击展开</span>
          </div>
          <div className="space-y-2.5">
            {sortedIssues.map((issue, idx) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                priority={priorityMap[issue.id]}
                solution={solutionMap[issue.id]}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══ 4. DROPOFF ════════════════════════════════════════════════════════════ */}
      {blockedStep && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
          <SectionLabel color="text-red-500">流失断点</SectionLabel>
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-[15px] font-black text-red-700 leading-snug">
                Step {blockedStep.step}：{blockedStep.action}
              </p>
              {blockedStep.note && (
                <p className="text-[12px] text-red-600/80 leading-snug">{blockedStep.note}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ 5. PRIORITIES ════════════════════════════════════════════════════════ */}
      {result.priorities?.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <SectionLabel>全局优先级</SectionLabel>
          <p className="text-[11px] text-slate-400 -mt-2 mb-3">跨问题的整体行动建议</p>
          <div className="space-y-2.5">
            {result.priorities.map((p, idx) => {
              const issue = result.issues?.find(i => i.id === p.issueId)
              const sol = solutionMap[p.issueId]
              return (
                <div key={idx} className="flex items-start gap-2.5 group">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0 self-start mt-1 ${PRIORITY_STYLE[p.priority] ?? PRIORITY_STYLE.P2}`}>
                    {p.priority}
                  </span>
                  <div className="flex-1 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 group-hover:border-blue-200 group-hover:bg-blue-50/40 transition-colors">
                    <p className="text-[13px] font-semibold text-slate-700">{issue?.title ?? p.issueId}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.reason}</p>
                    {sol && (
                      <p className="text-[11px] text-blue-600 mt-1.5 pt-1.5 border-t border-slate-100">{sol.solution}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 text-center pb-2">
        基于视觉认知模拟 · 不等同于真实用户测试 · 仅供参考
      </p>
    </div>
  )
}
