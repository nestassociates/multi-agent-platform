import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { MediaTextComponent } from "./media-text"

export type ImagePosition = "left" | "right"
export type ImageWidth = "33" | "50" | "66"

export interface MediaTextOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mediaText: {
      /**
       * Insert a Media & Text block
       */
      setMediaText: (options: {
        src: string
        alt?: string
        imagePosition?: ImagePosition
        imageWidth?: ImageWidth
      }) => ReturnType
    }
  }
}

/**
 * Media & Text block node for TipTap
 * Contains an image and editable text content side by side
 */
export const MediaText = Node.create<MediaTextOptions>({
  name: "mediaText",

  group: "block",

  // Allows nested block content (paragraphs, headings, lists)
  content: "block+",

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-src"),
        renderHTML: (attributes) => ({
          "data-src": attributes.src,
        }),
      },
      alt: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-alt") || "",
        renderHTML: (attributes) => ({
          "data-alt": attributes.alt,
        }),
      },
      imagePosition: {
        default: "left" as ImagePosition,
        parseHTML: (element) =>
          (element.getAttribute("data-image-position") as ImagePosition) || "left",
        renderHTML: (attributes) => ({
          "data-image-position": attributes.imagePosition,
        }),
      },
      imageWidth: {
        default: "50" as ImageWidth,
        parseHTML: (element) =>
          (element.getAttribute("data-image-width") as ImageWidth) || "50",
        renderHTML: (attributes) => ({
          "data-image-width": attributes.imageWidth,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="media-text"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "media-text",
      }),
      0, // Represents where content goes
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaTextComponent)
  },

  addCommands() {
    return {
      setMediaText:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt || "",
              imagePosition: options.imagePosition || "left",
              imageWidth: options.imageWidth || "50",
            },
            content: [{ type: "paragraph" }],
          })
        },
    }
  },
})

export default MediaText
