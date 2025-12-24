export type JSDocTag = {
  tag: string
  type?: string
  name?: string
  description?: string
}

const normalize = (s: string) => s.replace(/\r\n?/g, "\n").trim()

/**
 * Splits a docstring into `@tag ...` chunks.
 *
 * Works even if the comment is flattened into a single line, e.g.
 * `@param {str} x - desc @param {int} y - desc`.
 */
export const splitIntoTags = (doc: string): JSDocTag[] => {
  const text = normalize(doc)
  if (!text) {
    return []
  }

  const matches = [...text.matchAll(/@([A-Za-z_][A-Za-z0-9_]*)\b/g)]
  if (matches.length === 0) {
    return []
  }

  const chunks: { tag: string; chunk: string }[] = []
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const tag = m[1]!
    const start = m.index!
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : text.length
    chunks.push({ tag, chunk: text.slice(start, end).trim() })
  }

  const parsed: JSDocTag[] = []
  for (const { tag, chunk } of chunks) {
    // @tag {type} name - description
    const m = chunk.match(
      new RegExp(
        `^@${tag}\\s*(?:\\{([^\\}]+)\\})?\\s*([^\\s]+)?\\s*(?:[-:]\\s*)?([\\s\\S]*)$`,
      ),
    )
    const type = m?.[1]?.trim() || undefined
    const name = m?.[2]?.trim() || undefined
    const description = m?.[3]?.trim() || undefined
    parsed.push({ tag, type, name, description })
  }

  return parsed
}

const mdInlineCode = (s: string) => `\`${s.replace(/`/g, "\\`")}\``

/**
 * Turns HubSpot-style macro doc comments (JSDoc-ish) into readable Markdown.
 *
 * Supported tags: @name, @description, @param, @property.
 * Supports `:` or `-` separators.
 */
export const formatJSDocLikeMarkdown = (doc: string) => {
  const raw = normalize(doc)
  if (!raw) {
    return raw
  }

  const tags = splitIntoTags(raw)
  if (tags.length === 0) {
    // No tags; keep as-is.
    return raw
  }

  const nameTag = tags.find((t) => t.tag === "name")
  const descriptionTag = tags.find((t) => t.tag === "description")
  const params = tags.filter((t) => t.tag === "param")
  const props = tags.filter((t) => t.tag === "property")

  const lines: string[] = []

  if (nameTag?.name) {
    const parts: string[] = ["**" + nameTag.name + "**"]
    if (nameTag.type) {
      parts.push(mdInlineCode(nameTag.type))
    }
    if (nameTag.description) {
      parts.push("— " + nameTag.description)
    }
    lines.push(parts.join(" "))
  }

  if (descriptionTag?.description) {
    lines.push(descriptionTag.description)
  }

  if (params.length) {
    lines.push(
      [
        "**Parameters**",
        params
          .filter((p) => p.name)
          .map((p) => {
            const left = mdInlineCode(p.name!)
            const type = p.type ? `: ${mdInlineCode(p.type)}` : ""
            const desc = p.description ? ` — ${p.description}` : ""
            return `- ${left}${type}${desc}`
          })
          .join("\n"),
      ].join("\n"),
    )
  }

  if (props.length) {
    lines.push(
      [
        "**Properties**",
        props
          .filter((p) => p.name)
          .map((p) => {
            const left = mdInlineCode(p.name!)
            const type = p.type ? `: ${mdInlineCode(p.type)}` : ""
            const desc = p.description ? ` — ${p.description}` : ""
            return `- ${left}${type}${desc}`
          })
          .join("\n"),
      ].join("\n"),
    )
  }

  // Fallback: if we didn't render anything (malformed tags), keep raw.
  return lines.filter(Boolean).join("\n\n") || raw
}
