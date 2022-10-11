import { Mark, markPasteRule, mergeAttributes } from '@tiptap/core'
import { find } from 'linkifyjs'
import { autolink } from './helpers/autoLink'

export interface LinkOptions {
  /**
   * If enabled, it adds links as you type.
   */
  autolink: boolean,
  /**
   * If enabled, links will be opened on click.
   */
  openOnClick: boolean,
  /**
   * Adds a link to the current selection if the pasted content only contains an url.
   */
  linkOnPaste: boolean,

  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    link: {
      /**
       * Set a link mark
       */
      setLink: (attributes: { href: string, target?: string }) => ReturnType,
      /**
       * Toggle a link mark
       */
      toggleLink: (attributes: { href: string, target?: string }) => ReturnType,
      /**
       * Unset a link mark
       */
      unsetLink: () => ReturnType,
    }
  }
}

export const NeighbourhoddLink = Mark.create<LinkOptions>({
  name: 'neighbourhood-link',

  priority: 1000,

  keepOnSplit: false,

  inclusive() {
    return this.options.autolink
  },

  addOptions() {
    return {
      openOnClick: true,
      linkOnPaste: true,
      autolink: true,
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {}
  },

  parseHTML() {
    return [
      { tag: 'span[data-neighbourhood]' },
    ]
  },

  renderHTML({ mark, HTMLAttributes }) {
    console.log('mark', mark, HTMLAttributes)
    return [
      'span',
      mergeAttributes(
        { 'data-neighbourhood': '' }, 
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ]
  },

  addCommands() {
    return {
      setLink: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes)
      },

      toggleLink: attributes => ({ commands }) => {
        return commands.toggleMark(this.name, attributes, { extendEmptyMarkRange: true })
      },

      unsetLink: () => ({ commands }) => {
        return commands.unsetMark(this.name, { extendEmptyMarkRange: true })
      },
    }
  },

  renderText({ node }) {
    return this.options.renderLabel({
      options: this.options,
      node,
    });
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: text => find(text)
          .filter(link => link.isLink)
          .map(link => ({
            text: link.value,
            index: link.start,
            data: link,
          })),
        type: this.type,
        getAttributes: match => ({
          href: match.data?.href,
        }),
      }),
    ]
  },

  addProseMirrorPlugins() {
    const plugins = []

    if (this.options.autolink) {
      plugins.push(autolink({
        type: this.type,
      }))
    }
    
    return plugins
  },
})
