"use client"

import { forwardRef } from "react"
import type { Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useImageAlign } from "./use-image-align"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"

// --- Icons ---
import { AlignLeftIcon } from "@/components/tiptap-icons/align-left-icon"
import { AlignCenterIcon } from "@/components/tiptap-icons/align-center-icon"
import { AlignRightIcon } from "@/components/tiptap-icons/align-right-icon"

// --- Types ---
import type { ImageAlignment } from "@/components/tiptap-node/resizable-image/resizable-image-extension"

export interface ImageAlignPopoverProps {
  editor?: Editor | null
}

/**
 * Bubble menu popover that appears when an image is selected.
 * Provides controls for alignment (left/center/right) and float (wrap text).
 */
export const ImageAlignPopover = forwardRef<HTMLDivElement, ImageAlignPopoverProps>(
  ({ editor: providedEditor }, ref) => {
    const { editor } = useTiptapEditor(providedEditor)
    const {
      currentAlign,
      setAlign,
      canAlign,
    } = useImageAlign({ editor })

    if (!editor) {
      return null
    }

    return (
      <BubbleMenu
        editor={editor}
        options={{
          placement: "top",
          offset: 10,
        }}
        shouldShow={({ editor: e }) => e.isActive("image")}
        className="tiptap-image-align-popover"
      >
        <div
          ref={ref}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          {/* Alignment buttons */}
          <AlignButton
            align="left"
            currentAlign={currentAlign}
            onAlign={setAlign}
            disabled={!canAlign}
            tooltip="Align left"
          />
          <AlignButton
            align="center"
            currentAlign={currentAlign}
            onAlign={setAlign}
            disabled={!canAlign}
            tooltip="Align center"
          />
          <AlignButton
            align="right"
            currentAlign={currentAlign}
            onAlign={setAlign}
            disabled={!canAlign}
            tooltip="Align right"
          />
        </div>
      </BubbleMenu>
    )
  }
)

ImageAlignPopover.displayName = "ImageAlignPopover"

// --- Helper Components ---

interface AlignButtonProps {
  align: ImageAlignment
  currentAlign: ImageAlignment
  onAlign: (align: ImageAlignment) => void
  disabled: boolean
  tooltip: string
}

function AlignButton({
  align,
  currentAlign,
  onAlign,
  disabled,
  tooltip,
}: AlignButtonProps) {
  const isActive = currentAlign === align

  const Icon =
    align === "left"
      ? AlignLeftIcon
      : align === "center"
        ? AlignCenterIcon
        : AlignRightIcon

  return (
    <Button
      type="button"
      data-style="ghost"
      data-active-state={isActive ? "on" : "off"}
      disabled={disabled}
      onClick={() => onAlign(align)}
      aria-label={tooltip}
      tooltip={tooltip}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export default ImageAlignPopover
