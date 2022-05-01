import path from 'pathe'
import fs from 'fs-extra'
import type { Plugin } from 'histoire'
import { defu } from 'defu'

interface ScreenshotPresets {
  /**
   * Screenshot width.
   */
  width?: number
  /**
   * Screenshot height.
   */
  height?: number
}

export interface ScreenshotPluginOptions {
  /**
   * Folder were screenshots will be saved.
   */
  saveFolder?: string
  /**
   * Ignored stories.
   */
  ignored?: (file: string, story: { title: string }, variant: { id: string, title: string }) => boolean
  /**
   * Presets for each screenshot.
   */
  presets?: ScreenshotPresets[]
}

const defaultOptions: ScreenshotPluginOptions = {
  saveFolder: '.histoire/screenshots',
  presets: [],
}

export function HstScreenshot (options: ScreenshotPluginOptions = {}): Plugin {
  const finalOptions: ScreenshotPluginOptions = defu(options, defaultOptions)
  if (!finalOptions.presets.length) {
    finalOptions.presets.push({
      width: 1280,
      height: 800,
    })
  }
  return {
    name: '@histoire/plugin-screenshot',

    onBuild: async api => {
      const { default: captureWebsite } = await import('capture-website')
      await fs.ensureDir(finalOptions.saveFolder)

      api.onRenderStory(async ({ file, story, variant, html }) => {
        if (finalOptions.ignored?.(file, { title: story.title }, { id: variant.id, title: variant.title })) {
          return
        }
        console.log('Rendering screenshot for', file, 'title:', story.title, 'variant:', variant.id, 'title:', variant.title)
        for (const preset of finalOptions.presets) {
          await captureWebsite.file(html, path.join(finalOptions.saveFolder, `${story.id}-${variant.id}.png`), {
            inputType: 'html',
            overwrite: true,
            width: preset.width,
            height: preset.height,
          })
          await fs.writeFile(path.join(finalOptions.saveFolder, `${story.id}-${variant.id}.html`), html)
        }
      })
    },
  }
}
