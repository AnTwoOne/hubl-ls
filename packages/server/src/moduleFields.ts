/**
 * Module fields support for HubSpot modules.
 *
 * Parses fields.json and converts field definitions to TypeInfo
 * for autocomplete and type checking in module.html files.
 */

import { TypeInfo, TypeReference } from "./types"

/**
 * HubSpot field definition from fields.json
 */
export interface FieldDefinition {
  name: string
  id?: string
  label?: string
  type: string
  required?: boolean
  default?: unknown
  help_text?: string
  inline_help_text?: string
  // For groups and repeaters
  children?: FieldDefinition[]
  // Occurrence defines repeating behavior for groups
  // If max > 1 or max is null/undefined (unlimited), it's a repeater (list)
  // If max === 1 or no occurrence, it's a single group (dict)
  occurrence?: {
    min?: number
    max?: number | null
    default?: number
  }
  // For choice fields
  choices?: Array<{ value: string; label: string } | [string, string]>
  // Legacy format: some modules use "fields" instead of "children"
  fields?: FieldDefinition[]
}

/**
 * Simple type mapping from HubSpot field types to base type names
 */
const SIMPLE_TYPE_MAP: Record<string, string> = {
  // Text fields
  text: "str",
  textarea: "str",
  richtext: "str",
  simplemenu: "str",

  // Number fields
  number: "int",

  // Boolean
  boolean: "bool",

  // Choice fields (return string value)
  choice: "str",
  dropdown: "str",

  // Simple ID/reference fields
  page: "int",
  blog: "int",
  blogpost: "int",
  file: "str",
  date: "int",
  datetime: "int",
  hubdbtable: "int",
  meeting: "str",
  menu: "int",
  blog_author: "int",
  textalignment: "str",
}

/**
 * Complex type mapping for fields that return dict/object structures
 */
const COMPLEX_TYPE_MAP: Record<string, TypeInfo> = {
  // Color returns a dict with color property
  color: {
    name: "dict",
    properties: {
      color: { type: "str" },
      opacity: { type: "int" },
    },
  },

  // Font field
  font: {
    name: "dict",
    properties: {
      color: { type: "str" },
      size: { type: "int" },
      size_unit: { type: "str" },
      font: { type: "str" },
      font_set: { type: "str" },
      variant: { type: "str" },
      fallback: { type: "str" },
      styles: { name: "dict" },
    },
  },

  // Image field
  image: {
    name: "dict",
    properties: {
      src: { type: "str" },
      alt: { type: "str" },
      width: { type: "int" },
      height: { type: "int" },
      loading: { type: "str" },
      size_type: { type: "str" },
      max_width: { type: "int" },
      max_height: { type: "int" },
    },
  },

  // Background image
  backgroundimage: {
    name: "dict",
    properties: {
      src: { type: "str" },
      background_position: { type: "str" },
      background_size: { type: "str" },
    },
  },

  // Icon field
  icon: {
    name: "dict",
    properties: {
      name: { type: "str" },
      type: { type: "str" },
      unicode: { type: "str" },
    },
  },

  // Link field
  link: {
    name: "dict",
    properties: {
      url: { name: "dict" },
      open_in_new_tab: { type: "bool" },
      no_follow: { type: "bool" },
      sponsored: { type: "bool" },
    },
  },

  // URL field
  url: {
    name: "dict",
    properties: {
      href: { type: "str" },
      type: { type: "str" },
    },
  },

  // CTA field
  cta: {
    name: "dict",
    properties: {
      guid: { type: "str" },
    },
  },

  // Form field
  form: {
    name: "dict",
    properties: {
      form_id: { type: "str" },
      response_type: { type: "str" },
      message: { type: "str" },
      redirect_url: { type: "str" },
    },
  },

  // Spacing
  spacing: {
    name: "dict",
    properties: {
      top: { name: "dict" },
      bottom: { name: "dict" },
      left: { name: "dict" },
      right: { name: "dict" },
      padding: { name: "dict" },
      margin: { name: "dict" },
    },
  },

  // Border
  border: {
    name: "dict",
    properties: {
      top: { name: "dict" },
      bottom: { name: "dict" },
      left: { name: "dict" },
      right: { name: "dict" },
    },
  },

  // Alignment
  alignment: {
    name: "dict",
    properties: {
      horizontal_align: { type: "str" },
      vertical_align: { type: "str" },
    },
  },

  // Gradient
  gradient: {
    name: "dict",
    properties: {
      side_or_corner: { name: "dict" },
      colors: { name: "list" },
    },
  },

  // Video
  videoplayer: {
    name: "dict",
    properties: {
      player_id: { type: "int" },
      height: { type: "int" },
      width: { type: "int" },
      conversion_asset: { name: "dict" },
    },
  },

  // Embed
  embed: {
    name: "dict",
    properties: {
      source_type: { type: "str" },
    },
  },

  // Payment
  payment: {
    name: "dict",
    properties: {
      id: { type: "str" },
    },
  },

  // Logo
  logo: {
    name: "dict",
    properties: {
      src: { type: "str" },
      alt: { type: "str" },
      width: { type: "int" },
      height: { type: "int" },
      override_inherited_src: { type: "bool" },
      suppress_company_name: { type: "bool" },
    },
  },

  // Follow me / social
  followmelinks: {
    name: "list",
  },

  // Tag (for filtering)
  tag: {
    name: "dict",
    properties: {
      id: { type: "int" },
      name: { type: "str" },
      slug: { type: "str" },
    },
  },

  // CRM object
  crmobject: {
    name: "dict",
    properties: {
      id: { type: "str" },
      properties: { name: "dict" },
    },
  },
}

/**
 * Parse fields.json content and return field definitions
 */
export const parseFieldsJson = (content: string): FieldDefinition[] | null => {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return parsed
    }
    // Some modules might have fields as a property
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.fields)) {
      return parsed.fields
    }
    return null
  } catch {
    return null
  }
}

/**
 * Build formatted documentation for a field definition.
 * Shows: id, field_type, properties, help_text, inline_help_text
 */
const buildFieldDocumentation = (
  field: FieldDefinition,
  complexType: TypeInfo | undefined,
  children?: FieldDefinition[],
): string => {
  const lines: string[] = []

  // Field ID and type header
  const fieldId = field.id ?? field.name
  lines.push(`**${fieldId}** \`${field.type}\``)

  // Help text
  if (field.help_text) {
    lines.push("")
    lines.push(field.help_text)
  }

  // Inline help text (italicized)
  if (field.inline_help_text) {
    lines.push("")
    lines.push(`*${field.inline_help_text}*`)
  }

  // Properties from children (for group/fieldgroup)
  if (children && children.length > 0) {
    lines.push("")
    lines.push("**Properties:**")
    for (const child of children) {
      if (child && child.name) {
        lines.push(`- \`${child.name}\` \`${child.type}\``)
      }
    }
  }
  // Properties from complex types (for built-in complex fields)
  else if (complexType?.properties) {
    lines.push("")
    lines.push("**Properties:**")
    for (const [propName, propInfo] of Object.entries(complexType.properties)) {
      let propType = "Any"
      if (typeof propInfo === "object" && propInfo !== null) {
        if ("type" in propInfo && typeof propInfo.type === "string") {
          propType = propInfo.type
        } else if ("name" in propInfo && typeof propInfo.name === "string") {
          propType = propInfo.name
        }
      }
      lines.push(`- \`${propName}\` \`${propType}\``)
    }
  }

  return lines.join("\n")
}

/**
 * Convert a single field definition to TypeInfo
 * @param field - The field definition from fields.json
 * @param parentPath - The path to this field's parent (for nested fields)
 */
const fieldToTypeInfo = (
  field: FieldDefinition,
  parentPath: string[] = [],
): TypeInfo | TypeReference => {
  // Guard against malformed field definitions
  if (!field || typeof field.type !== "string") {
    return { name: "Any", documentation: "Unknown field" }
  }

  const fieldPath = [...parentPath, field.name]
  const fieldTypeLower = field.type.toLowerCase()
  const simpleType = SIMPLE_TYPE_MAP[fieldTypeLower]
  const complexType = COMPLEX_TYPE_MAP[fieldTypeLower]

  // Build formatted documentation
  const documentation = buildFieldDocumentation(field, complexType)

  // Handle group fields (nested structure)
  // A group with occurrence.max > 1 (or null/undefined for unlimited) is a repeater (list)
  // A group with occurrence.max === 1 or no occurrence is a single group (dict)
  if (fieldTypeLower === "group" || fieldTypeLower === "fieldgroup") {
    const children = field.children ?? field.fields ?? []
    const childProperties: Record<string, TypeInfo | TypeReference> = {}

    for (const child of children) {
      if (child && child.name) {
        childProperties[child.name] = fieldToTypeInfo(child, fieldPath)
      }
    }

    // Rebuild documentation with children info
    const groupDocumentation = buildFieldDocumentation(field, undefined, children)

    // Check if this is a repeater (list) based on occurrence
    const isRepeater =
      field.occurrence !== undefined &&
      (field.occurrence.max === null ||
        field.occurrence.max === undefined ||
        field.occurrence.max > 1)

    if (isRepeater) {
      // Build documentation for the element type (each item in the repeater)
      const elementDocLines: string[] = []
      elementDocLines.push(`**${field.name}** item`)
      if (children.length > 0) {
        elementDocLines.push("")
        elementDocLines.push("**Properties:**")
        for (const child of children) {
          if (child && child.name) {
            elementDocLines.push(`- \`${child.name}\` \`${child.type}\``)
          }
        }
      }
      const elementDocumentation = elementDocLines.join("\n")

      // Repeater: returns a list of dicts
      // The element's properties have fieldPath set for go-to-definition
      return {
        name: "list",
        documentation: groupDocumentation,
        fieldPath,
        elementType: {
          name: "dict",
          documentation: elementDocumentation,
          properties: childProperties,
        },
      }
    } else {
      // Single group: returns a dict
      return {
        name: "dict",
        documentation: groupDocumentation,
        fieldPath,
        properties: childProperties,
      }
    }
  }

  // Handle choice fields - add choices to documentation
  if (
    (fieldTypeLower === "choice" || fieldTypeLower === "dropdown") &&
    field.choices
  ) {
    const choiceLines = field.choices.map((c) => {
      if (Array.isArray(c)) {
        return `- \`${c[0]}\` ${c[1] || ""}`
      }
      return `- \`${c.value}\` ${c.label || ""}`
    })
    const choiceDoc = documentation + "\n\n**Choices:**\n" + choiceLines.join("\n")

    return {
      name: "str",
      documentation: choiceDoc,
      fieldPath,
    }
  }

  // Use simple type mapping
  if (simpleType) {
    return {
      name: simpleType,
      documentation,
      fieldPath,
    }
  }

  // Use complex type mapping
  if (complexType) {
    return {
      name: complexType.name,
      documentation,
      fieldPath,
      properties: complexType.properties
        ? { ...complexType.properties }
        : undefined,
      elementType: complexType.elementType,
    }
  }

  // Unknown field type - treat as any
  return {
    name: "Any",
    documentation: documentation ?? `Unknown field type: ${field.type}`,
    fieldPath,
  }
}

/**
 * Convert an array of field definitions to a module TypeInfo
 */
export const fieldsToModuleTypeInfo = (
  fields: FieldDefinition[],
): TypeInfo => {
  const properties: Record<string, TypeInfo | TypeReference> = {}

  for (const field of fields) {
    if (field.name) {
      properties[field.name] = fieldToTypeInfo(field)
    }
  }

  return {
    name: "module",
    documentation:
      "Module fields defined in fields.json. Access field values using dot notation (e.g., module.field_name).",
    properties,
  }
}

/**
 * Check if a filename indicates a module template
 */
export const isModuleTemplate = (filename: string): boolean => {
  const basename = filename.split("/").pop()?.split("\\").pop() ?? ""
  return basename.toLowerCase() === "module.html"
}

/**
 * Get the expected fields.json path for a module.html file
 */
export const getFieldsJsonPath = (moduleHtmlPath: string): string => {
  // Replace module.html with fields.json in the same directory
  const dir = moduleHtmlPath.replace(/[/\\][^/\\]+$/, "")
  return `${dir}/fields.json`
}

/**
 * Find the position of a field definition in fields.json content.
 * Returns the start and end offsets of the field's "name" value.
 *
 * @param content - The raw fields.json content
 * @param fieldPath - Array of field names for nested access (e.g., ["settings", "max_width"])
 * @returns The start and end offsets, or undefined if not found
 */
export const findFieldPosition = (
  content: string,
  fieldPath: string[],
): { start: number; end: number } | undefined => {
  if (fieldPath.length === 0) {
    return undefined
  }

  // For each level in the path, find the field and narrow down the search scope
  let searchContent = content
  let searchOffset = 0

  for (let pathIndex = 0; pathIndex < fieldPath.length; pathIndex++) {
    const fieldName = fieldPath[pathIndex]
    const isLastField = pathIndex === fieldPath.length - 1

    // Find the "name": "fieldName" pattern
    const namePattern = new RegExp(
      `"name"\\s*:\\s*"${escapeRegExp(fieldName)}"`,
    )
    const match = searchContent.match(namePattern)

    if (!match || match.index === undefined) {
      return undefined
    }

    if (isLastField) {
      // Return the position of the field name value (the quoted string)
      const matchIndex = searchOffset + match.index
      const nameValueStart = matchIndex + match[0].lastIndexOf('"' + fieldName + '"')
      const nameValueEnd = nameValueStart + fieldName.length + 2 // +2 for quotes
      return { start: nameValueStart, end: nameValueEnd }
    }

    // For nested fields, we need to find the containing object and then its children
    // First, find the start of the object containing this "name" field
    // Walk backwards from the match to find the opening brace
    const objectStart = findObjectStart(searchContent, match.index)
    if (objectStart === -1) {
      return undefined
    }

    // Find the end of this object
    const objectEnd = findMatchingBracket(searchContent, objectStart)
    if (objectEnd === -1) {
      return undefined
    }

    // Extract the object content and search for "children" or "fields" within it
    const objectContent = searchContent.slice(objectStart, objectEnd + 1)
    const childrenMatch = objectContent.match(/"(?:children|fields)"\s*:\s*\[/)
    if (!childrenMatch || childrenMatch.index === undefined) {
      return undefined
    }

    // Find the children array boundaries within the object
    const childrenArrayStart = objectStart + childrenMatch.index + childrenMatch[0].length
    const childrenArrayEnd = findMatchingBracket(searchContent, childrenArrayStart - 1)
    if (childrenArrayEnd === -1) {
      return undefined
    }

    // Narrow down search to within the children array
    searchContent = searchContent.slice(childrenArrayStart, childrenArrayEnd)
    searchOffset = searchOffset + childrenArrayStart
  }

  return undefined
}

/**
 * Find the start of the JSON object containing the given position.
 * Walks backwards to find the opening brace.
 */
const findObjectStart = (str: string, fromPos: number): number => {
  let depth = 0
  let inString = false
  let i = fromPos - 1

  while (i >= 0) {
    const char = str[i]

    // Check for escaped characters (look ahead since we're going backwards)
    if (i > 0 && str[i - 1] === "\\") {
      i--
      continue
    }

    if (char === '"') {
      inString = !inString
    } else if (!inString) {
      if (char === "}" || char === "]") {
        depth++
      } else if (char === "{") {
        if (depth === 0) {
          return i
        }
        depth--
      } else if (char === "[") {
        depth--
      }
    }
    i--
  }
  return -1
}

/**
 * Find the position of the matching closing bracket for an opening bracket.
 */
const findMatchingBracket = (str: string, openPos: number): number => {
  const openChar = str[openPos]
  const closeChar = openChar === "[" ? "]" : openChar === "{" ? "}" : ""
  if (!closeChar) {
    return -1
  }

  let depth = 1
  let inString = false
  let escape = false

  for (let i = openPos + 1; i < str.length; i++) {
    const char = str[i]
    if (escape) {
      escape = false
      continue
    }
    if (char === "\\") {
      escape = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) {
      continue
    }
    if (char === openChar) {
      depth++
    } else if (char === closeChar) {
      depth--
      if (depth === 0) {
        return i
      }
    }
  }
  return -1
}

/**
 * Escape special regex characters in a string
 */
const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
