'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical, ImagePlus } from 'lucide-react'
import { UploadedImage } from '@/types'
import { Button } from '@/components/ui/button'

interface SortableImageItemProps {
  image: UploadedImage
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
}

function SortableImageItem({ image, onRemove, onRename }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex flex-col gap-2 w-40 flex-shrink-0"
    >
      <div className="relative group rounded-lg overflow-hidden border-2 border-border bg-muted aspect-[9/16]">
        {/* Step badge */}
        <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          Step {image.order}
        </div>

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-8 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-white drop-shadow" />
        </div>

        {/* Remove button */}
        <button
          onClick={() => onRemove(image.id)}
          className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Image */}
        <img
          src={image.previewUrl}
          alt={image.stepName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Step name input */}
      <input
        type="text"
        value={image.stepName}
        onChange={(e) => onRename(image.id, e.target.value)}
        className="text-xs text-center bg-transparent border-b border-border focus:outline-none focus:border-primary px-1 py-0.5 w-full"
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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
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
    },
    [images, onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 5,
    disabled: images.length >= 5,
  })

  const handleRemove = (id: string) => {
    const updated = images
      .filter((img) => img.id !== id)
      .map((img, i) => ({ ...img, order: i + 1 }))
    onChange(updated)
  }

  const handleRename = (id: string, name: string) => {
    onChange(images.map((img) => (img.id === id ? { ...img, stepName: name } : img)))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id)
      const newIndex = images.findIndex((img) => img.id === over.id)
      const reordered = arrayMove(images, oldIndex, newIndex).map((img, i) => ({
        ...img,
        order: i + 1,
      }))
      onChange(reordered)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">流程截图上传</h2>
        <span className="text-sm text-muted-foreground">{images.length} / 5 张</span>
      </div>

      {/* Upload zone */}
      {images.length < 5 && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
        >
          <input {...getInputProps()} />
          <ImagePlus className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">拖拽截图到这里，或点击上传</p>
          <p className="text-xs text-muted-foreground mt-1">
            支持 PNG / JPG / WebP，最多 5 张
          </p>
        </div>
      )}

      {/* Image list */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((image) => (
                <SortableImageItem
                  key={image.id}
                  image={image}
                  onRemove={handleRemove}
                  onRename={handleRename}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {images.length > 1 && (
        <p className="text-xs text-muted-foreground">
          拖拽图片可调整步骤顺序
        </p>
      )}
    </div>
  )
}
