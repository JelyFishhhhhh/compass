import tags from './tags.json'
import { buildTagIndex } from './tag-index.mjs'

export { tags }
export const tagIndex = buildTagIndex(tags)
