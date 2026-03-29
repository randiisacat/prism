'use client'

import { useState } from 'react'
import { ImageUploader } from '@/components/ImageUploader'
import { TaskConfigPanel } from '@/components/TaskConfigPanel'
import { VisualizationPanel } from '@/components/VisualizationPanel'
import { AnalysisReport } from '@/components/AnalysisReport'
import { UploadedImage, TaskConfig, StructuredAnalysis } from '@/types'
import { Loader2, Sparkles, BarChart3, ArrowRight, Route, AlertTriangle, TrendingDown, Lightbulb } from 'lucide-react'

// ─── Header ──────────────────────────────────────────────────────────────────
function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-200">
            <span className="text-white text-xs font-black">P</span>
          </div>
          <span className="font-bold text-[15px] tracking-tight text-slate-900">Prism</span>
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <a
          href="#workspace"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-700 transition-colors"
        >
          开始使用
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  )
}

// ─── Result Preview ───────────────────────────────────────────────────────────
function ResultPreview() {
  const items = [
    { icon: <Route className="w-4 h-4" />, label: '用户操作路径', desc: '逐步还原用户视线与操作顺序', color: 'text-blue-500 bg-blue-50' },
    { icon: <AlertTriangle className="w-4 h-4" />, label: '关键阻塞点', desc: '定位 Top 3 卡点与困惑原因', color: 'text-orange-500 bg-orange-50' },
    { icon: <TrendingDown className="w-4 h-4" />, label: '流失风险', desc: '预测最可能中途放弃的步骤', color: 'text-red-500 bg-red-50' },
    { icon: <Lightbulb className="w-4 h-4" />, label: '优化建议', desc: '针对每个问题给出具体改进方案', color: 'text-emerald-500 bg-emerald-50' },
  ]
  return (
    <section className="py-14 bg-white border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6 text-center">分析结果将包括</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-200">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                {item.icon}
              </div>
              <div className="text-[13px] font-semibold text-slate-900 mb-1">{item.label}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-500 flex items-center justify-center">
            <span className="text-white text-[9px] font-black">P</span>
          </div>
          <span className="text-[13px] font-semibold text-slate-700">Prism</span>
        </div>
        <span className="text-xs text-slate-400">AI 可用性测试助手 · Demo 版本 · 结果仅供参考</span>
      </div>
    </footer>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [taskConfig, setTaskConfig] = useState<TaskConfig>({
    task: '',
    userType: 'new_user',
    mode: 'single',
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<StructuredAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canAnalyze = images.length > 0 && taskConfig.task.trim()

  const handleAnalyze = async () => {
    if (!canAnalyze) return
    setIsAnalyzing(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('task', taskConfig.task)
      formData.append('userType', taskConfig.userType)
      formData.append('mode', taskConfig.mode)
      formData.append('stepNames', JSON.stringify(images.map((img) => img.stepName)))
      images.forEach((img, i) => formData.append(`image_${i}`, img.file))
      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '分析失败')
      setResult(data)
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '分析失败，请重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ── First Screen: Workspace ── */}
      <section
        id="workspace"
        className="relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #dbeafe 0%, #eff6ff 40%, #ffffff 75%)',
        }}
      >
        {/* Grid bg — [层级调整] 降低 opacity，让背景更退后 */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="g" width="44" height="44" patternUnits="userSpaceOnUse">
                <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#3B82F6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>
        </div>
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-300/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 pt-14 pb-14">

          {/* [层级调整] 标题降级：字号缩小，颜色变浅，不再是页面最强元素 */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              AI 可用性分析 · 无需真实用户
            </div>
            {/* 字号从 48px → 34px；颜色从 slate-900 → slate-500，视觉权重大幅降低 */}
            <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight text-slate-700 leading-[1.2] mb-2">
              让 AI 模拟真实用户完成任务
            </h1>
            <p className="text-[13px] text-slate-400 max-w-md mx-auto">
              上传截图 + 输入任务，自动发现关键阻塞点
            </p>
          </div>

          {/* Workspace grid — [层级调整] gap 拉大，给模块之间更多呼吸感 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* [层级调整] 上传区：视觉第一中心 ──────────────────────────────
                - border 加粗加蓝（border-blue-200 + border-2）
                - 背景更亮（bg-white）
                - shadow 增强
                - 内部 icon 放大 1.5 倍，文案重写
            */}
            <div className="lg:col-span-2 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-200 p-6">
              <ImageUploader images={images} onChange={setImages} />
            </div>

            {/* [层级调整] 任务区：降权为辅助配置
                - 背景 slate-50/40（更淡）
                - border slate-100（更轻）
                - 去掉 shadow
            */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <TaskConfigPanel config={taskConfig} onChange={setTaskConfig} />
            </div>
          </div>

          {/* [层级调整] 按钮：视觉第二重点，尺寸增加，圆角加大 */}
          <div className="flex flex-col items-center gap-3">
            {error && (
              <div className="w-full max-w-md rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 text-center">
                {error}
              </div>
            )}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || isAnalyzing}
              className={`
                inline-flex items-center gap-2.5 px-12 rounded-2xl text-[15px] font-bold transition-all duration-200 whitespace-nowrap
                ${canAnalyze && !isAnalyzing
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }
              `}
              style={{ height: '60px' }}
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" />AI 正在模拟用户行为...</>
              ) : (
                <>开始分析任务 <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
            {!canAnalyze && !isAnalyzing && (
              <p className="text-xs text-slate-400">需要：至少 1 张截图 + 任务描述</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Result Preview ── */}
      <ResultPreview />

      {/* ── Analysis Results ── */}
      {result && (
        <section id="results" className="py-14 bg-slate-50 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6 space-y-6">
            {/* Section header */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <h2 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                分析结果
              </h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Visualization — full width, prominent */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <VisualizationPanel
                images={images.map((img) => ({ url: img.previewUrl, stepName: img.stepName }))}
                pageAnalyses={result.pageAnalyses}
              />
            </div>

            {/* Report sections — single column */}
            <AnalysisReport result={result} />
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
