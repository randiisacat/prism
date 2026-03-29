'use client'

import { TaskConfig, UserType, AnalysisMode } from '@/types'
import { Sparkles } from 'lucide-react'

const USER_TYPES: { value: UserType; label: string; desc: string; emoji: string }[] = [
  { value: 'new_user', label: '新用户', desc: '首次使用，不熟悉产品', emoji: '👤' },
  { value: 'experienced_user', label: '老用户', desc: '熟悉产品，有使用习惯', emoji: '⭐' },
  { value: 'high_intent_user', label: '高意图', desc: '目标明确，急于完成', emoji: '🎯' },
]

const MODES: { value: AnalysisMode; label: string; desc: string }[] = [
  { value: 'single', label: '单页模式', desc: '分析单个页面' },
  { value: 'flow', label: '流程模式', desc: '模拟完整任务流程' },
]

interface TaskConfigPanelProps {
  config: TaskConfig
  onChange: (config: TaskConfig) => void
}

export function TaskConfigPanel({ config, onChange }: TaskConfigPanelProps) {
  return (
    <div className="space-y-5 flex flex-col h-full">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">任务设定</h2>
        <p className="text-xs text-slate-400 mt-0.5">描述用户要完成的目标</p>
      </div>

      {/* Task input */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-slate-600">用户任务 *</label>
        <textarea
          placeholder="描述用户目标，例如：完成商品购买流程"
          value={config.task}
          onChange={(e) => onChange({ ...config, task: e.target.value })}
          rows={5}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none transition-all placeholder:text-slate-400"
        />
      </div>

      {/* User type */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-600">用户类型</label>
        <div className="grid grid-cols-3 gap-2">
          {USER_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => onChange({ ...config, userType: type.value })}
              className={`text-left px-2.5 py-2.5 rounded-lg border transition-all duration-150 ${
                config.userType === type.value
                  ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-base mb-1">{type.emoji}</div>
              <div className={`text-[11px] font-semibold leading-tight ${config.userType === type.value ? 'text-blue-700' : 'text-slate-700'}`}>
                {type.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-600">分析模式</label>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(mode => (
            <button
              key={mode.value}
              onClick={() => onChange({ ...config, mode: mode.value })}
              className={`text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                config.mode === mode.value
                  ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`text-xs font-semibold ${config.mode === mode.value ? 'text-blue-700' : 'text-slate-700'}`}>
                {mode.label}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-400 flex items-start gap-1 mt-auto pt-2">
        <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5 text-indigo-300" />
        分析基于页面视觉与通用认知习惯模拟，不等同于真实用户测试
      </p>
    </div>
  )
}
