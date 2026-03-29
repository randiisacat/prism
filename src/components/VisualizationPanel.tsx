'use client'

import { useEffect, useRef, useState } from 'react'
import { PageAnalysis, AnnotationRegion } from '@/types'

const ANNOTATION_COLORS = {
  attention: { fill: 'rgba(59, 130, 246, 0.2)', stroke: 'rgba(59, 130, 246, 0.8)', label: '注意区域', badge: 'bg-blue-100 text-blue-700' },
  action: { fill: 'rgba(249, 115, 22, 0.2)', stroke: 'rgba(249, 115, 22, 0.8)', label: '操作路径', badge: 'bg-orange-100 text-orange-700' },
  confusion: { fill: 'rgba(239, 68, 68, 0.2)', stroke: 'rgba(239, 68, 68, 0.8)', label: '困惑区域', badge: 'bg-red-100 text-red-700' },
}

interface AnnotatedImageProps {
  imageUrl: string
  analysis: PageAnalysis
  stepLabel: string
}

function AnnotatedImage({ imageUrl, analysis, stepLabel }: AnnotatedImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredAnnotation, setHoveredAnnotation] = useState<number | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const ratio = img.naturalHeight / img.naturalWidth
        setDimensions({ width: containerWidth, height: containerWidth * ratio })
      }
    }
    img.src = imageUrl
  }, [imageUrl])

  const toPixels = (annotation: AnnotationRegion) => ({
    x: (annotation.x / 100) * dimensions.width,
    y: (annotation.y / 100) * dimensions.height,
    width: (annotation.width / 100) * dimensions.width,
    height: (annotation.height / 100) * dimensions.height,
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {stepLabel}
        </span>
        <span className="text-sm font-medium">{analysis.stepName}</span>
      </div>

      <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden border border-border">
        <img
          src={imageUrl}
          alt={analysis.stepName}
          className="w-full block"
        />

        {/* SVG overlay */}
        {dimensions.width > 0 && (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            preserveAspectRatio="none"
          >
            {analysis.annotations.map((ann, idx) => {
              const px = toPixels(ann)
              const color = ANNOTATION_COLORS[ann.type]
              return (
                <g key={idx}>
                  <rect
                    x={px.x}
                    y={px.y}
                    width={px.width}
                    height={px.height}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth="2"
                    rx="4"
                    className="cursor-pointer transition-opacity"
                    opacity={hoveredAnnotation === null || hoveredAnnotation === idx ? 1 : 0.4}
                    onMouseEnter={() => setHoveredAnnotation(idx)}
                    onMouseLeave={() => setHoveredAnnotation(null)}
                  />
                  {/* Annotation index badge */}
                  <circle
                    cx={px.x + 10}
                    cy={px.y + 10}
                    r="10"
                    fill={color.stroke}
                  />
                  <text
                    x={px.x + 10}
                    y={px.y + 14}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {idx + 1}
                  </text>
                </g>
              )
            })}

            {/* Operation path arrows */}
            {analysis.annotations.length > 1 &&
              analysis.annotations.slice(0, -1).map((ann, idx) => {
                const from = toPixels(ann)
                const to = toPixels(analysis.annotations[idx + 1])
                const x1 = from.x + from.width / 2
                const y1 = from.y + from.height / 2
                const x2 = to.x + to.width / 2
                const y2 = to.y + to.height / 2
                return (
                  <line
                    key={`arrow-${idx}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    markerEnd="url(#arrowhead)"
                  />
                )
              })}

            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.6)" />
              </marker>
            </defs>
          </svg>
        )}
      </div>

      {/* Annotation legend */}
      {analysis.annotations.length > 0 && (
        <div className="space-y-1.5">
          {analysis.annotations.map((ann, idx) => {
            const color = ANNOTATION_COLORS[ann.type]
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 text-xs p-2 rounded-lg transition-colors cursor-default ${
                  hoveredAnnotation === idx ? 'bg-muted' : ''
                }`}
                onMouseEnter={() => setHoveredAnnotation(idx)}
                onMouseLeave={() => setHoveredAnnotation(null)}
              >
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${color.badge.replace('text-', 'bg-').split(' ')[0]}`}
                  style={{ background: ANNOTATION_COLORS[ann.type].stroke }}
                >
                  {idx + 1}
                </span>
                <div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mr-1 ${color.badge}`}>
                    {color.label}
                  </span>
                  {ann.label}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface VisualizationPanelProps {
  images: { url: string; stepName: string }[]
  pageAnalyses: PageAnalysis[]
}

export function VisualizationPanel({ images, pageAnalyses }: VisualizationPanelProps) {
  const [activeStep, setActiveStep] = useState(0)

  const legend = [
    { type: 'attention' as const, label: '注意区域', color: 'bg-blue-400' },
    { type: 'action' as const, label: '操作路径', color: 'bg-orange-400' },
    { type: 'confusion' as const, label: '困惑区域', color: 'bg-red-400' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">行为热区标注</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">AI 模拟用户视线与操作区域</p>
        </div>
        <div className="flex gap-3">
          {legend.map((l) => (
            <div key={l.type} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className={`w-2.5 h-2.5 rounded-sm ${l.color} opacity-80`} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Step tabs */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeStep === idx
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Step {idx + 1} · {img.stepName}
            </button>
          ))}
        </div>
      )}

      {/* Active image annotation */}
      {images[activeStep] && pageAnalyses[activeStep] && (
        <AnnotatedImage
          imageUrl={images[activeStep].url}
          analysis={pageAnalyses[activeStep]}
          stepLabel={`Step ${activeStep + 1}`}
        />
      )}
    </div>
  )
}
