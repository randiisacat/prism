'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical, Layers, UploadCloud } from 'lucide-react'
import { UploadedImage } from '@/types'

interface SortableImageItemProps {
  image: UploadedImage
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
}

function SortableImageItem({ image, onRemove, onRename }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="relative flex flex-col gap-2 w-[120px] flex-shrink-0">
      <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-[9/16] shadow-sm hover:shadow-md transition-shadow">
        <div className="absolute top-2 left-2 z-10 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
          {image.order}
        </div>
        <div
          {...attributes} {...listeners}
          className="absolute top-2 right-7 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-3.5 h-3.5 text-white drop-shadow" />
        </div>
        <button
          onClick={() => onRemove(image.id)}
          className="absolute top-1.5 right-1.5 z-10 w-5 h-5 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
        <img src={image.previewUrl} alt={image.stepName} className="w-full h-full object-cover" />
      </div>
      <input
        type="text"
        value={image.stepName}
        onChange={(e) => onRename(image.id, e.target.value)}
        className="text-[11px] text-center bg-transparent border-b border-slate-200 focus:border-indigo-400 focus:outline-none px-1 py-0.5 w-full text-slate-600 placeholder:text-slate-400"
        placeholder="页面名称"
      />
    </div>
  )
}

interface ImageUploaderProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remaining = 5 - images.length
    const filesToAdd = acceptedFiles.slice(0, remaining)
    const newImages: UploadedImage[] = filesToAdd.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      previewUrl: URL.createObjectURL(file),
      stepName: `页面 ${images.length + i + 1}`,
      order: images.length + i + 1,
    }))
    onChange([...images, ...newImages])
  }, [images, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 5,
    disabled: images.length >= 5,
  })

  const handleRemove = (id: string) => {
    onChange(images.filter(img => img.id !== id).map((img, i) => ({ ...img, order: i + 1 })))
  }

  const handleRename = (id: string, name: string) => {
    onChange(images.map(img => img.id === id ? { ...img, stepName: name } : img))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(img => img.id === active.id)
      const newIndex = images.findIndex(img => img.id === over.id)
      onChange(arrayMove(images, oldIndex, newIndex).map((img, i) => ({ ...img, order: i + 1 })))
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">流程截图</h2>
          <p className="text-xs text-slate-400 mt-0.5">按流程顺序上传关键页面</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Layers className="w-3.5 h-3.5" />
          <span>{images.length} / 5</span>
        </div>
      </div>

      {/* Drop zone */}
      {images.length < 5 && (
        <div
          {...getRootProps()}
          className={`
            relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200
            ${isDragActive
              ? 'border-blue-400 bg-blue-50/60 scale-[1.01]'
              : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/20'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-blue-100 text-blue-500' : 'bg-blue-50 text-blue-400'}`}>
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-slate-700">
                {isDragActive ? '放开以上传' : '上传关键流程截图'}
              </p>
              <p className="text-[13px] text-slate-400 mt-1">拖拽或点击上传 · 最多 5 张</p>
            </div>
          </div>
        </div>
      )}

      {/* Image list */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map(img => img.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map(image => (
                <SortableImageItem key={image.id} image={image} onRemove={handleRemove} onRename={handleRename} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {images.length > 1 && (
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <GripVertical className="w-3 h-3" /> 拖拽图片可调整步骤顺序
        </p>
      )}
    </div>
  )
}
