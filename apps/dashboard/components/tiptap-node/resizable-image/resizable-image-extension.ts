import ImageResize from "tiptap-extension-resize-image"

export type ImageAlignment = "left" | "center" | "right"
export type ImageFloat = "none" | "left" | "right"

interface ImageAttributes {
  align?: ImageAlignment
  float?: ImageFloat
  containerStyle?: string
  wrapperStyle?: string
  [key: string]: unknown
}

/**
 * Build wrapperStyle based on float value
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
 * Build containerStyle based on align value, preserving width
 */
function buildContainerStyle(align: ImageAlignment, existingStyle?: string): string {
  // Extract width from existing style if present
  const widthMatch = existingStyle?.match(/width:\s*([^;]+);?/)
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

/**
 * Extended Image extension with:
 * - Drag handle resizing (from tiptap-extension-resize-image)
 * - Alignment (left/center/right)
 * - Float (none/left/right) for text wrapping
 */
export const ResizableImage = ImageResize.extend({
  name: "image",

  addAttributes() {
    // Get parent attributes - use type assertion since tiptap-extension-resize-image types don't include parent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parentAttributes = (this as any).parent?.() || {}

    return {
      // Include parent attributes (src, alt, title, width, height from ImageResize)
      ...parentAttributes,

      // Alignment attribute for block-level positioning
      align: {
        default: "center" as ImageAlignment,
        parseHTML: (element: HTMLElement) =>
          (element.getAttribute("data-align") as ImageAlignment) || "center",
        renderHTML: (attributes: ImageAttributes) => ({
          "data-align": attributes.align,
        }),
      },

      // Float attribute for text wrapping
      float: {
        default: "none" as ImageFloat,
        parseHTML: (element: HTMLElement) =>
          (element.getAttribute("data-float") as ImageFloat) || "none",
        renderHTML: (attributes: ImageAttributes) => ({
          "data-float": attributes.float,
        }),
      },

      // Override containerStyle to rebuild from align/float on parse
      containerStyle: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          // First check for existing containerStyle attribute
          const existingStyle = element.getAttribute("containerstyle")

          // Get align and float from data attributes
          const align = (element.getAttribute("data-align") as ImageAlignment) || "center"
          const float = (element.getAttribute("data-float") as ImageFloat) || "none"

          // If floating, container just needs basic style (wrapper handles float)
          if (float !== "none") {
            const widthMatch = existingStyle?.match(/width:\s*([^;]+);?/)
            const width = widthMatch ? widthMatch[1] : (element.getAttribute("width") ? `${element.getAttribute("width")}px` : "100%")
            return `width: ${width}; height: auto; cursor: pointer;`
          }

          // For non-float, build from align
          if (existingStyle) {
            return existingStyle
          }

          const width = element.getAttribute("width")
          return buildContainerStyle(align, width ? `width: ${width}px;` : undefined)
        },
        renderHTML: (attributes: ImageAttributes) => ({
          containerstyle: attributes.containerStyle,
        }),
      },

      // Override wrapperStyle to rebuild from float on parse
      wrapperStyle: {
        default: "display: flex",
        parseHTML: (element: HTMLElement) => {
          const float = (element.getAttribute("data-float") as ImageFloat) || "none"
          return buildWrapperStyle(float)
        },
        renderHTML: (attributes: ImageAttributes) => ({
          wrapperstyle: attributes.wrapperStyle,
        }),
      },
    }
  },
})

export default ResizableImage
