'use client'

import { useState } from 'react'
import { ImageUploader } from '@/components/ImageUploader'
import { TaskConfigPanel } from '@/components/TaskConfigPanel'
import { VisualizationPanel } from '@/components/VisualizationPanel'
import { AnalysisReport } from '@/components/AnalysisReport'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { UploadedImage, TaskConfig, AnalysisResult } from '@/types'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [taskConfig, setTaskConfig] = useState<TaskConfig>({
    task: '',
    userType: 'new_user',
    mode: 'single',
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
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

      images.forEach((img, i) => {
        formData.append(`image_${i}`, img.file)
      })

      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || '分析失败')
      setResult(data)

      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '分析失败，请重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-black">P</span>
            </div>
            <span className="font-bold text-lg">Prism</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Beta</span>
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">AI 驱动的用户可用性模拟测试</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Input section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border bg-card p-5">
            <ImageUploader images={images} onChange={setImages} />
          </div>
          <div className="rounded-xl border bg-card p-5">
            <TaskConfigPanel config={taskConfig} onChange={setTaskConfig} />
          </div>
        </div>

        {/* Analyze button */}
        <div className="flex flex-col items-center gap-3">
          {error && (
            <div className="w-full max-w-md rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 text-center">
              {error}
            </div>
          )}
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={!canAnalyze || isAnalyzing}
            className="px-12 h-12 text-base font-semibold"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI 正在模拟用户行为...
              </>
            ) : (
              '开始分析'
            )}
          </Button>
          {!canAnalyze && !isAnalyzing && (
            <p className="text-xs text-muted-foreground">
              需要：至少1张截图 + 任务描述
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div id="results" className="space-y-6">
            <Separator />
            <h2 className="text-2xl font-bold text-center">分析结果</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border bg-card p-5">
                <VisualizationPanel
                  images={images.map((img) => ({ url: img.previewUrl, stepName: img.stepName }))}
                  pageAnalyses={result.pageAnalyses}
                />
              </div>
              <div className="rounded-xl border bg-card p-5">
                <AnalysisReport result={result} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t mt-16 py-6 text-center text-xs text-muted-foreground">
        Prism · AI 可用性测试助手 · Demo 版本
      </footer>
    </div>
  )
}
