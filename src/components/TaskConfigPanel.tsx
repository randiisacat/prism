'use client'

import { TaskConfig, UserType, AnalysisMode } from '@/types'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const TASK_TEMPLATES = [
  '完成注册',
  '购买商品',
  '发布内容',
  '找到会员入口',
  '完成支付',
  '修改个人资料',
]

const USER_TYPES: { value: UserType; label: string; desc: string }[] = [
  { value: 'new_user', label: '新用户', desc: '首次使用，不熟悉产品' },
  { value: 'experienced_user', label: '老用户', desc: '熟悉产品，有使用习惯' },
  { value: 'high_intent_user', label: '高意图用户', desc: '目标明确，急于完成任务' },
]

const MODES: { value: AnalysisMode; label: string; desc: string }[] = [
  { value: 'single', label: '单页模式', desc: '分析单个页面的可用性' },
  { value: 'flow', label: '流程模式', desc: '模拟完整多步骤任务流程' },
]

interface TaskConfigPanelProps {
  config: TaskConfig
  onChange: (config: TaskConfig) => void
}

export function TaskConfigPanel({ config, onChange }: TaskConfigPanelProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">任务设定</h2>

      {/* Task input */}
      <div className="space-y-3">
        <label className="text-sm font-medium">用户任务 *</label>
        <Textarea
          placeholder="描述用户想要完成的目标，例如：完成商品购买流程"
          value={config.task}
          onChange={(e) => onChange({ ...config, task: e.target.value })}
          className="resize-none"
          rows={3}
        />

        {/* Quick templates */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">快捷模板</p>
          <div className="flex flex-wrap gap-2">
            {TASK_TEMPLATES.map((template) => (
              <Badge
                key={template}
                variant={config.task === template ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => onChange({ ...config, task: template })}
              >
                {template}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* User type */}
      <div className="space-y-3">
        <label className="text-sm font-medium">用户类型</label>
        <div className="grid grid-cols-1 gap-2">
          {USER_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => onChange({ ...config, userType: type.value })}
              className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                config.userType === type.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{type.label}</span>
                {config.userType === type.value && (
                  <span className="text-xs text-primary">已选择</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Analysis mode */}
      <div className="space-y-3">
        <label className="text-sm font-medium">分析模式</label>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onChange({ ...config, mode: mode.value })}
              className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                config.mode === mode.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="text-sm font-medium">{mode.label}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
