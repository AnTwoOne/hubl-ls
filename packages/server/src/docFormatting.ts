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

/** Maximum depth for expanding typedef references */
const MAX_TYPEDEF_EXPANSION_DEPTH = 5

/** Primitive/builtin types that should not be expanded */
const PRIMITIVE_TYPES = new Set([
  "string",
  "str",
  "number",
  "int",
  "integer",
  "float",
  "bool",
  "boolean",
  "any",
  "object",
  "dict",
  "list",
  "array",
  "tuple",
  "null",
  "undefined",
])

export interface TypedefInfo {
  properties?: Map<string, { type: string; description?: string }>
  documentation?: string
}

/**
 * Format a property line with optional nested properties from typedef expansion.
 */
const formatPropertyLine = (
  name: string,
  type: string | undefined,
  description: string | undefined,
  indent: number,
  typedefs: Map<string, TypedefInfo> | undefined,
  depth: number,
  expandedTypes: Set<string>,
): string => {
  const indentStr = "    ".repeat(indent)
  const bullet = indent === 0 ? "- " : "- "
  const left = `**${name}**`
  const typeStr = type ? `: \`${type}\`` : ""
  const desc = description ? ` — *${description}*` : ""
  let line = `${indentStr}${bullet}${left}${typeStr}${desc}`

  // Check if type is a typedef reference that should be expanded
  if (
    type &&
    typedefs &&
    depth < MAX_TYPEDEF_EXPANSION_DEPTH &&
    !PRIMITIVE_TYPES.has(type.toLowerCase()) &&
    !expandedTypes.has(type)
  ) {
    const typedef = typedefs.get(type)
    if (typedef?.properties && typedef.properties.size > 0) {
      // Track this type to prevent infinite recursion
      const newExpandedTypes = new Set(expandedTypes)
      newExpandedTypes.add(type)

      // Expand the typedef's properties as nested items
      const nestedLines: string[] = []
      for (const [propName, propInfo] of typedef.properties) {
        nestedLines.push(
          formatPropertyLine(
            propName,
            propInfo.type,
            propInfo.description,
            indent + 1,
            typedefs,
            depth + 1,
            newExpandedTypes,
          ),
        )
      }
      if (nestedLines.length > 0) {
        line += "\n" + nestedLines.join("\n")
      }
    }
  }

  return line
}

/**
 * Turns HubSpot-style macro doc comments (JSDoc-ish) into readable Markdown.
 *
 * Supported tags: @name, @description, @param, @property, @example, @deprecated, @see, @since.
 * Supports `:` or `-` separators.
 *
 * @param doc - The raw documentation string
 * @param typedefs - Optional map of typedef names to their info for expanding type references
 */
export const formatJSDocLikeMarkdown = (
  doc: string,
  typedefs?: Map<string, TypedefInfo>,
) => {
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
  const deprecatedTag = tags.find((t) => t.tag === "deprecated")
  const params = tags.filter((t) => t.tag === "param")
  const props = tags.filter((t) => t.tag === "property")
  const examples = tags.filter((t) => t.tag === "example")
  const seeTag = tags.find((t) => t.tag === "see")
  const sinceTag = tags.find((t) => t.tag === "since")

  const sections: string[] = []

  // Deprecated warning at the top - highly visible
  if (deprecatedTag) {
    const reasonParts = [deprecatedTag.name, deprecatedTag.description].filter(
      Boolean,
    )
    const reason = reasonParts.join(" ")
    sections.push(`> ⚠️ **Deprecated**${reason ? `: ${reason}` : ""}`)
  }

  // Name/title section with type badge
  if (nameTag?.name) {
    let title = `### ${nameTag.name}`
    if (nameTag.type) {
      title += ` • ${mdInlineCode(nameTag.type)}`
    }
    sections.push(title)
    if (nameTag.description) {
      sections.push(nameTag.description)
    }
  }

  // Description
  if (descriptionTag?.description) {
    sections.push(descriptionTag.description)
  }

  // Parameters section with table-like formatting
  if (params.length) {
    const paramLines = params
      .filter((p) => p.name)
      .map((p) => {
        const typeStr = p.type ? `: \`${p.type}\`` : ""
        const desc = p.description ? ` — *${p.description}*` : ""
        return `- **${p.name!}**${typeStr}${desc}`
      })
    sections.push(["**Parameters**", ...paramLines].join("\n"))
  }

  // Properties section with nested expansion
  if (props.length) {
    const propLines = props
      .filter((p) => p.name)
      .map((p) =>
        formatPropertyLine(
          p.name!,
          p.type,
          p.description,
          0,
          typedefs,
          0,
          new Set(),
        ),
      )
    sections.push(["**Properties**", ...propLines].join("\n"))
  }

  // Examples with syntax-highlighted code blocks
  if (examples.length) {
    const exampleBlocks = examples
      .map((e) => {
        const code = e.name || e.description || ""
        return "```hubl\n" + code + "\n```"
      })
      .join("\n")
    sections.push(`**Example**\n${exampleBlocks}`)
  }

  // Footer metadata
  const footerParts: string[] = []
  if (seeTag) {
    const ref = seeTag.name || seeTag.description || ""
    if (ref) {
      footerParts.push(`🔗 See: ${mdInlineCode(ref)}`)
    }
  }
  if (sinceTag) {
    const version = sinceTag.name || sinceTag.description || ""
    if (version) {
      footerParts.push(`📌 Since ${version}`)
    }
  }
  if (footerParts.length > 0) {
    sections.push(`---\n*${footerParts.join("  •  ")}*`)
  }

  // Fallback: if we didn't render anything (malformed tags), keep raw.
  return sections.filter(Boolean).join("\n\n") || raw
}

/**
 * Check if a documentation string contains @deprecated tag.
 */
export const isDeprecated = (doc: string): boolean => {
  const tags = splitIntoTags(doc)
  return tags.some((t) => t.tag === "deprecated")
}

/**
 * Get the deprecation message if present.
 */
export const getDeprecationMessage = (doc: string): string | undefined => {
  const tags = splitIntoTags(doc)
  const deprecatedTag = tags.find((t) => t.tag === "deprecated")
  if (!deprecatedTag) return undefined
  const reasonParts = [deprecatedTag.name, deprecatedTag.description].filter(
    Boolean,
  )
  return reasonParts.length > 0 ? reasonParts.join(" ") : "This is deprecated."
}

export interface ParsedTypedef {
  name: string
  baseType: string
  properties: Map<string, { type: string; description?: string }>
  documentation?: string
}

/**
 * Parse @typedef from a documentation comment.
 * Returns the typedef info if found, otherwise undefined.
 *
 * Supports:
 * - @typedef {object} TypeName
 * - @property {type} TypeName.propName - description
 */
export const parseTypedef = (doc: string): ParsedTypedef | undefined => {
  const tags = splitIntoTags(doc)
  const typedefTag = tags.find((t) => t.tag === "typedef")

  if (!typedefTag || !typedefTag.name) {
    return undefined
  }

  const name = typedefTag.name
  const baseType = typedefTag.type || "object"
  const descriptionTag = tags.find((t) => t.tag === "description")
  const documentation = descriptionTag?.description || typedefTag.description

  const properties = new Map<string, { type: string; description?: string }>()

  // Collect @property tags that belong to this typedef
  for (const tag of tags) {
    if (tag.tag !== "property" || !tag.name) continue

    // Property can be "TypeName.propName" or just "propName"
    let propName = tag.name
    if (propName.startsWith(name + ".")) {
      propName = propName.slice(name.length + 1)
    }

    // Handle nested properties (e.g., "data.nested.prop")
    properties.set(propName, {
      type: tag.type || "Any",
      description: tag.description,
    })
  }

  return { name, baseType, properties, documentation }
}
