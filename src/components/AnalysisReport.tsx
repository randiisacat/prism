'use client'

import { useState } from 'react'
import { AnalysisResult, RiskLevel, BlockingPoint } from '@/types'
import { AlertTriangle, CheckCircle, XCircle, TrendingDown, ChevronDown, ChevronUp, Users, BarChart2, ArrowDown } from 'lucide-react'

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

const PRIORITY_STYLE: Record<string, string> = {
  P0: 'bg-red-500 text-white',
  P1: 'bg-orange-400 text-white',
  P2: 'bg-slate-200 text-slate-600',
}

const COST_STYLE: Record<string, string> = {
  low:    'bg-emerald-100 text-emerald-700',
  medium: 'bg-blue-100 text-blue-700',
  high:   'bg-slate-100 text-slate-600',
}

function isBlockingStep(step: string, blockingPoints: BlockingPoint[]): boolean {
  return blockingPoints.some(
    (bp) => bp.severity === 'high' && step.toLowerCase().includes(bp.title.slice(0, 4).toLowerCase())
  )
}

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${color ?? 'text-slate-400'}`}>
      {children}
    </p>
  )
}

// ─── Blocking Point Card ──────────────────────────────────────────────────────
function BlockingCard({ point, index }: { point: BlockingPoint; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)
  const sev = RISK_CONFIG[point.severity]
  const priority = point.priority ?? (index === 0 ? 'P0' : index === 1 ? 'P1' : 'P2')

  return (
    <div className="rounded-xl overflow-hidden border border-slate-100">
      <div className="flex">
        <div className={`w-1 flex-shrink-0 ${sev.barColor}`} />
        <div className="flex-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left px-4 py-3 flex items-center gap-2"
          >
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.P2}`}>
              {priority}
            </span>
            <span className="text-[13px] font-semibold text-slate-800 flex-1 leading-snug">{point.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
              point.severity === 'high'   ? 'bg-red-100 text-red-600' :
              point.severity === 'medium' ? 'bg-orange-100 text-orange-500' :
                                            'bg-slate-100 text-slate-500'
            }`}>{sev.label}</span>
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            }
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">

              {/* 结论句 — 最大最粗，无背景，视觉第一 */}
              <p className="text-[13px] font-semibold text-slate-800 leading-relaxed">
                {point.description}
              </p>

              {/* 原因 / 影响 — 降权，小字，紧凑 */}
              <div className="space-y-1 pl-1 border-l-2 border-slate-100">
                <div className="flex gap-1.5 items-baseline">
                  <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">原因</span>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{point.reason}</p>
                </div>
                <div className="flex gap-1.5 items-baseline">
                  <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">影响</span>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{point.impact}</p>
                </div>
              </div>

              {/* 用户心理 */}
              {point.mentalModel && (
                <div className="rounded-lg bg-blue-50/60 border border-blue-100 px-3 py-2.5 flex gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-0.5">用户心理</p>
                    <p className="text-[12px] text-slate-700 leading-relaxed">{point.mentalModel}</p>
                  </div>
                </div>
              )}

              {/* 业务影响 */}
              {point.businessImpact && (
                <div className="flex gap-2 items-start">
                  <BarChart2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-slate-600 leading-relaxed">{point.businessImpact}</p>
                </div>
              )}

              {/* 新用户 vs 老用户 */}
              {(point.newUserImpact || point.experiencedUserImpact) && (
                <div className="grid grid-cols-2 gap-2">
                  {point.newUserImpact && (
                    <div className="rounded-lg border border-slate-100 px-3 py-2">
                      <p className="text-[10px] font-semibold text-slate-400 mb-0.5">新用户</p>
                      <p className="text-[12px] text-slate-600">{point.newUserImpact}</p>
                    </div>
                  )}
                  {point.experiencedUserImpact && (
                    <div className="rounded-lg border border-slate-100 px-3 py-2">
                      <p className="text-[10px] font-semibold text-slate-400 mb-0.5">老用户</p>
                      <p className="text-[12px] text-slate-600">{point.experiencedUserImpact}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 三档方案 */}
              {point.suggestions && point.suggestions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">改进方案</p>
                  {point.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${COST_STYLE[s.cost] ?? COST_STYLE.medium}`}>
                        {s.costLabel}
                      </span>
                      <p className="text-[12px] text-slate-700 leading-relaxed flex-1 pt-0.5">{s.action}</p>
                    </div>
                  ))}
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
  result: AnalysisResult
}

export function AnalysisReport({ result }: AnalysisReportProps) {
  const risk = RISK_CONFIG[result.riskLevel]

  const sorted = [...result.blockingPoints].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.severity] - order[b.severity]
  })

  // summary：取逗号/句号前第一段，最多 20 字，作为一句话结论
  const verdictLine = (() => {
    const cut = result.summary.split(/[，。,！!]/)[0] ?? result.summary
    return cut.length > 24 ? cut.slice(0, 24) + '…' : cut
  })()
  // firstReaction：取第一句，最多 30 字，作为原因行
  const reasonLine = (() => {
    const cut = result.firstReaction.split(/[。！!]/)[0] ?? result.firstReaction
    return cut.length > 32 ? cut.slice(0, 32) + '…' : cut
  })()

  return (
    <div className="space-y-4">

      {/* ══ 1. SUMMARY — 一句话结论 + 一句话原因 ══════════════════════════════ */}
      <div className={`rounded-2xl border-2 ${risk.borderColor} ${risk.bgColor} p-5`}>
        {/* 风险标签行 */}
        <div className="flex items-center gap-2 mb-3">
          <span className={risk.textColor}>{risk.icon}</span>
          <span className={`text-[11px] font-black uppercase tracking-widest ${risk.textColor}`}>{risk.label}</span>
        </div>
        {/* 结论句 — 一行，粗体，够狠 */}
        <p className={`text-[15px] font-black leading-snug ${risk.textColor} mb-2`}>
          {verdictLine}
        </p>
        {/* 原因行 — 细字，两行内 */}
        {reasonLine && (
          <p className="text-[12px] text-slate-500 leading-relaxed border-t border-white/50 pt-2">
            原因：{reasonLine}
          </p>
        )}
      </div>

      {/* ══ 2. OPERATION PATH — 流动感 timeline ═══════════════════════════════ */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <SectionLabel>操作路径</SectionLabel>
        <div className="flex flex-col">
          {result.operationPath.map((step, idx) => {
            const isBlocking = isBlockingStep(step, result.blockingPoints)
            const isDropoff  = result.dropoffRisk.step && step.includes(result.dropoffRisk.step.slice(0, 4))
            const isLast     = idx === result.operationPath.length - 1

            return (
              <div key={idx} className="flex flex-col">
                <div className="flex items-center gap-2">
                  {/* 序号圆圈 */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold
                    ${isBlocking ? 'bg-orange-400 text-white' : isDropoff ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  {/* Step 内容 */}
                  <div className={`flex-1 rounded-lg px-3 py-2 text-[12px] leading-snug
                    ${isBlocking ? 'bg-orange-50 border border-orange-200' :
                      isDropoff  ? 'bg-orange-50 border border-orange-100' :
                                   'bg-slate-50'}`}>
                    <div className="flex items-center gap-1.5">
                      {isBlocking && <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                      <span className={`${isBlocking ? 'text-orange-800 font-semibold' : isDropoff ? 'text-orange-700 font-medium' : 'text-slate-700'}`}>
                        {step}
                      </span>
                    </div>
                    {isBlocking && (
                      <p className="text-[11px] text-orange-400 mt-1">用户在此犹豫（认知不清）</p>
                    )}
                  </div>
                </div>
                {/* 箭头连接线 — 与序号圆圈中心对齐 */}
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

      {/* ══ 3. BLOCKING POINTS — 结论驱动 ════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>阻塞点 · {sorted.length} 处</SectionLabel>
          <span className="text-[10px] text-slate-400 -mt-3">点击展开</span>
        </div>
        <div className="space-y-2.5">
          {sorted.map((point, idx) => (
            <BlockingCard key={idx} point={point} index={idx} />
          ))}
        </div>
      </div>

      {/* ══ 4. DROPOFF ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <SectionLabel color="text-red-500">流失断点</SectionLabel>
        <div className="flex items-start gap-2.5">
          <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            {/* Step 名称 — 最重，红色粗体 */}
            <p className="text-[13px] font-bold text-red-700 leading-snug">
              {result.dropoffRisk.step}
            </p>
            {/* reason 按 | 拆成两行，每行一个 */}
            {result.dropoffRisk.reason.split('|').map((line, i) => (
              <p key={i} className="text-[12px] text-slate-600 leading-snug">
                {line.trim()}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 5. COGNITION MODEL — 用户默认认为 → 实际 → 结果 ══════════════════ */}
      {result.cognitionModel && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-400" />
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">用户认知</p>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 w-16 pt-0.5">默认认为</span>
              <p className="text-[13px] font-semibold text-slate-700 leading-snug flex-1">{result.cognitionModel.assumption}</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-[10px] font-bold text-orange-400 flex-shrink-0 w-16 pt-0.5">实际却是</span>
              <p className="text-[13px] text-slate-600 leading-snug flex-1">{result.cognitionModel.reality}</p>
            </div>
            <div className="flex gap-3 items-start border-t border-blue-100 pt-3">
              <span className="text-[10px] font-bold text-red-400 flex-shrink-0 w-16 pt-0.5">导致</span>
              <p className="text-[13px] font-semibold text-red-600 leading-snug flex-1">{result.cognitionModel.result}</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ 6. SUGGESTIONS — 优先级 + 行动导向 ══════════════════════════════ */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <SectionLabel>优化建议</SectionLabel>
        <div className="space-y-2.5">
          {result.suggestions.map((s, idx) => {
            const pKey = idx === 0 ? 'P0' : idx === 1 ? 'P1' : null
            return (
              <div key={idx} className="flex items-start gap-2.5 group">
                {pKey ? (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0 self-center ${PRIORITY_STYLE[pKey]}`}>
                    {pKey}
                  </span>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black flex-shrink-0 text-slate-500 self-center">
                    {idx + 1}
                  </div>
                )}
                <div className="flex-1 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 group-hover:border-blue-200 group-hover:bg-blue-50/40 transition-colors">
                  <p className="text-[13px] text-slate-700 leading-relaxed">{s}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 text-center pb-2">
        基于视觉认知模拟 · 不等同于真实用户测试 · 仅供参考
      </p>
    </div>
  )
}
