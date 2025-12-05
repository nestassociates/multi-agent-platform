"use client"

import { forwardRef, useCallback, useRef, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

// --- Icons ---
import { LayoutIcon } from "lucide-react"

// --- Lib ---
import { handleImageUpload } from "@/lib/tiptap-utils"

export interface MediaTextButtonProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
}

/**
 * Button component for inserting a Media & Text block in a Tiptap editor.
 * Opens a file picker to select an image, then inserts the block.
 */
export const MediaTextButton = forwardRef<
  HTMLButtonElement,
  MediaTextButtonProps
>(({ editor: providedEditor, text, onClick, children, ...buttonProps }, ref) => {
  const { editor } = useTiptapEditor(providedEditor)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const canInsert = editor?.can().setMediaText({ src: "" }) ?? false

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      fileInputRef.current?.click()
    },
    [onClick]
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !editor) return

      setIsUploading(true)

      try {
        // Upload the image using the existing upload handler
        const url = await handleImageUpload(file)

        // Insert the Media & Text block with the uploaded image
        editor.chain().focus().setMediaText({
          src: url,
          alt: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for alt
        }).run()
      } catch (error) {
        console.error("Failed to upload image for Media & Text:", error)
      } finally {
        setIsUploading(false)
        // Reset the input
        e.target.value = ""
      }
    },
    [editor]
  )

  if (!editor) {
    return null
  }

  return (
    <>
      <Button
        type="button"
        data-style="ghost"
        role="button"
        tabIndex={-1}
        disabled={!canInsert || isUploading}
        data-disabled={!canInsert || isUploading}
        aria-label="Insert Media & Text block"
        tooltip="Media & Text"
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <LayoutIcon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
          </>
        )}
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        style={{ display: "none" }}
      />
    </>
  )
})

MediaTextButton.displayName = "MediaTextButton"

export default MediaTextButton
