"use client"

import { useCallback, useRef } from "react"
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { AlignLeftIcon } from "@/components/tiptap-icons/align-left-icon"
import { AlignRightIcon } from "@/components/tiptap-icons/align-right-icon"
import { Trash2Icon, ImageIcon, RefreshCwIcon } from "lucide-react"
import type { ImagePosition, ImageWidth } from "./media-text-extension"

import "./media-text.scss"

const WIDTH_OPTIONS: ImageWidth[] = ["33", "50", "66"]

export function MediaTextComponent({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const { src, alt, imagePosition, imageWidth } = node.attrs as {
    src: string
    alt: string
    imagePosition: ImagePosition
    imageWidth: ImageWidth
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const togglePosition = useCallback(() => {
    updateAttributes({
      imagePosition: imagePosition === "left" ? "right" : "left",
    })
  }, [imagePosition, updateAttributes])

  const cycleWidth = useCallback(() => {
    const currentIndex = WIDTH_OPTIONS.indexOf(imageWidth)
    const nextIndex = (currentIndex + 1) % WIDTH_OPTIONS.length
    updateAttributes({ imageWidth: WIDTH_OPTIONS[nextIndex] })
  }, [imageWidth, updateAttributes])

  const handleReplaceImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Create a temporary URL for preview
      // In production, you'd upload to your server/storage
      const tempUrl = URL.createObjectURL(file)
      updateAttributes({ src: tempUrl, alt: file.name })

      // Reset the input
      e.target.value = ""
    },
    [updateAttributes]
  )

  return (
    <NodeViewWrapper
      data-type="media-text"
      className={`media-text media-text--${imagePosition} media-text--width-${imageWidth} ${selected ? "media-text--selected" : ""}`}
    >
      {/* Controls toolbar */}
      <div className="media-text__controls" contentEditable={false}>
        {/* Position toggle */}
        <Button
          type="button"
          data-style="ghost"
          onClick={togglePosition}
          aria-label={`Move image to ${imagePosition === "left" ? "right" : "left"}`}
          tooltip={`Image ${imagePosition === "left" ? "right" : "left"}`}
          className="h-7 w-7 p-0"
        >
          {imagePosition === "left" ? (
            <AlignRightIcon className="h-4 w-4" />
          ) : (
            <AlignLeftIcon className="h-4 w-4" />
          )}
        </Button>

        {/* Width selector */}
        <Button
          type="button"
          data-style="ghost"
          onClick={cycleWidth}
          aria-label={`Change width (currently ${imageWidth}%)`}
          tooltip={`Width: ${imageWidth}%`}
          className="h-7 px-2 text-xs font-medium"
        >
          {imageWidth}%
        </Button>

        {/* Replace image */}
        <Button
          type="button"
          data-style="ghost"
          onClick={handleReplaceImage}
          aria-label="Replace image"
          tooltip="Replace image"
          className="h-7 w-7 p-0"
        >
          <RefreshCwIcon className="h-4 w-4" />
        </Button>

        {/* Delete block */}
        <Button
          type="button"
          data-style="ghost"
          onClick={deleteNode}
          aria-label="Delete block"
          tooltip="Delete block"
          className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden file input for replacing image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image section */}
      <div className="media-text__image" contentEditable={false}>
        {src ? (
          <img src={src} alt={alt} draggable={false} />
        ) : (
          <div className="media-text__image-placeholder">
            <ImageIcon className="h-12 w-12 text-gray-300" />
            <span className="text-sm text-gray-400">No image</span>
          </div>
        )}
      </div>

      {/* Text content section with nested editable content */}
      <NodeViewContent className="media-text__content" />
    </NodeViewWrapper>
  )
}

export default MediaTextComponent
