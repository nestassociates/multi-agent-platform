"use client"

import { useCallback, useMemo } from "react"
import type { Editor } from "@tiptap/react"
import type { ImageAlignment, ImageFloat } from "@/components/tiptap-node/resizable-image/resizable-image-extension"

export interface UseImageAlignConfig {
  editor?: Editor | null
}

export interface UseImageAlignReturn {
  /** Whether an image is currently selected */
  isImageSelected: boolean
  /** Current alignment of selected image */
  currentAlign: ImageAlignment
  /** Current float of selected image */
  currentFloat: ImageFloat
  /** Set alignment of selected image */
  setAlign: (align: ImageAlignment) => void
  /** Set float of selected image */
  setFloat: (float: ImageFloat) => void
  /** Whether align is available */
  canAlign: boolean
}

/**
 * Helper to extract current float from wrapperStyle
 */
function getFloatFromStyle(wrapperStyle: string | undefined): ImageFloat {
  if (!wrapperStyle) return "none"
  if (wrapperStyle.includes("float: left")) return "left"
  if (wrapperStyle.includes("float: right")) return "right"
  return "none"
}

/**
 * Helper to extract current alignment from containerStyle
 */
function getAlignFromStyle(containerStyle: string | undefined): ImageAlignment {
  if (!containerStyle) return "center"
  // Check margins for alignment
  if (containerStyle.includes("margin: 0 auto 0 0") || containerStyle.includes("margin: 0px auto 0px 0px")) {
    return "left"
  }
  if (containerStyle.includes("margin: 0 0 0 auto") || containerStyle.includes("margin: 0px 0px 0px auto")) {
    return "right"
  }
  if (containerStyle.includes("margin: 0 auto") || containerStyle.includes("margin: 0px auto")) {
    return "center"
  }
  return "center"
}

/**
 * Build wrapperStyle for float
 */
function buildWrapperStyle(float: ImageFloat): string {
  switch (float) {
    case "left":
      return "display: inline-block; float: left; margin-right: 1.5rem; margin-bottom: 0.5rem;"
    case "right":
      return "display: inline-block; float: right; margin-left: 1.5rem; margin-bottom: 0.5rem;"
    default:
      return "display: flex"
  }
}

/**
 * Build containerStyle with alignment and preserve width
 */
function buildContainerStyle(align: ImageAlignment, currentContainerStyle: string | undefined): string {
  // Extract width from current style if it exists
  const widthMatch = currentContainerStyle?.match(/width:\s*([^;]+);?/)
  const width = widthMatch ? widthMatch[1] : "100%"

  const baseStyle = `width: ${width}; height: auto; cursor: pointer;`

  switch (align) {
    case "left":
      return `${baseStyle} margin: 0 auto 0 0;`
    case "right":
      return `${baseStyle} margin: 0 0 0 auto;`
    default:
      return `${baseStyle} margin: 0 auto;`
  }
}

export function useImageAlign({ editor }: UseImageAlignConfig): UseImageAlignReturn {
  const isImageSelected = useMemo(() => {
    if (!editor) return false
    return editor.isActive("image")
  }, [editor, editor?.state.selection])

  const currentAlign = useMemo((): ImageAlignment => {
    if (!editor) return "center"
    const attrs = editor.getAttributes("image")
    // First check our custom align attribute
    if (attrs?.align) return attrs.align as ImageAlignment
    // Fallback to parsing containerStyle
    return getAlignFromStyle(attrs?.containerStyle)
  }, [editor, editor?.state.selection])

  const currentFloat = useMemo((): ImageFloat => {
    if (!editor) return "none"
    const attrs = editor.getAttributes("image")
    // First check our custom float attribute
    if (attrs?.float && attrs.float !== "none") return attrs.float as ImageFloat
    // Fallback to parsing wrapperStyle
    return getFloatFromStyle(attrs?.wrapperStyle)
  }, [editor, editor?.state.selection])

  const canAlign = useMemo(() => {
    if (!editor) return false
    return editor.can().updateAttributes("image", {})
  }, [editor])

  const setAlign = useCallback(
    (align: ImageAlignment) => {
      if (!editor) return
      const attrs = editor.getAttributes("image")

      // Build new styles
      const newContainerStyle = buildContainerStyle(align, attrs?.containerStyle)
      const newWrapperStyle = "display: flex" // Reset to non-float

      editor
        .chain()
        .focus()
        .updateAttributes("image", {
          align,
          float: "none",
          containerStyle: newContainerStyle,
          wrapperStyle: newWrapperStyle,
        })
        .run()
    },
    [editor]
  )

  const setFloat = useCallback(
    (float: ImageFloat) => {
      if (!editor) return
      const attrs = editor.getAttributes("image")

      // Extract width from current style
      const widthMatch = attrs?.containerStyle?.match(/width:\s*([^;]+);?/)
      const width = widthMatch ? widthMatch[1] : "100%"

      // Build new styles
      const newWrapperStyle = buildWrapperStyle(float)
      // For float, container needs inline-block style
      const newContainerStyle = float === "none"
        ? buildContainerStyle("center", attrs?.containerStyle)
        : `width: ${width}; height: auto; cursor: pointer;`

      const align = float === "none" ? "center" : float

      editor
        .chain()
        .focus()
        .updateAttributes("image", {
          float,
          align,
          containerStyle: newContainerStyle,
          wrapperStyle: newWrapperStyle,
        })
        .run()
    },
    [editor]
  )

  return {
    isImageSelected,
    currentAlign,
    currentFloat,
    setAlign,
    setFloat,
    canAlign,
  }
}
