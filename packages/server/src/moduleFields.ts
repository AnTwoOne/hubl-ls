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
 */
const fieldToTypeInfo = (field: FieldDefinition): TypeInfo | TypeReference => {
  // Guard against malformed field definitions
  if (!field || typeof field.type !== "string") {
    return { name: "Any", documentation: "Unknown field" }
  }

  const fieldTypeLower = field.type.toLowerCase()
  const simpleType = SIMPLE_TYPE_MAP[fieldTypeLower]
  const complexType = COMPLEX_TYPE_MAP[fieldTypeLower]

  // Build formatted documentation
  const documentation = buildFieldDocumentation(field, complexType)

  // Handle group fields (nested structure)
  // A group with occurrence.max > 1 (or null/undefined for unlimited) is a repeater (list)
  // A group with occurrence.max === 1 or no occurrence is a single group (dict)
  if (fieldTypeLower === "group") {
    const children = field.children ?? field.fields ?? []
    const childProperties: Record<string, TypeInfo | TypeReference> = {}

    for (const child of children) {
      if (child && child.name) {
        childProperties[child.name] = fieldToTypeInfo(child)
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
      return {
        name: "list",
        documentation: groupDocumentation,
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
      type: "str",
      documentation: choiceDoc,
    }
  }

  // Use simple type mapping
  if (simpleType) {
    return {
      type: simpleType,
      documentation,
    }
  }

  // Use complex type mapping
  if (complexType) {
    return {
      name: complexType.name,
      documentation,
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
