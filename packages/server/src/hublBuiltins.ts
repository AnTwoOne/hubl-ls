import type { TypeInfo, TypeReference } from "./types"

/**
 * HubL built-ins (minimal starter set).
 *
 * Goal: provide high-signal completions/hover and reduce "unknown symbol" noise
 * without pretending we can model HubL runtime perfectly.
 *
 * Keep this file small and incrementally extend it with real HubSpot docs.
 */

export const HUBL_TAGS: string[] = [
  // Core rendering / assets
  "module",
  "widget",
  "require_css",
  "require_js",
  // Drag-and-drop
  "dnd_area",
  "dnd_section",
  "dnd_column",
]

/**
 * Tag "types" are only used for hover/docs and (optionally) arg completions.
 */
export const HUBL_TAG_TYPES: Record<string, TypeInfo> = {
  module: {
    name: "module",
    signature: {
      documentation:
        "Render a module. Common kwargs include `path`, `label`, `no_wrapper`, and module-specific fields.",
      arguments: [
        { name: "path", type: "str" },
        { name: "label", type: "str" },
        { name: "no_wrapper", type: "bool" },
      ],
      return: "None",
    },
  },
  widget: {
    name: "widget",
    signature: {
      documentation:
        "Render a legacy widget. Prefer `module` in modern themes when possible.",
      arguments: [{ name: "name", type: "str" }],
      return: "None",
    },
  },
  require_css: {
    name: "require_css",
    signature: {
      documentation: "Require a CSS asset for the current page/template.",
      arguments: [{ name: "path", type: "str" }],
      return: "None",
    },
  },
  require_js: {
    name: "require_js",
    signature: {
      documentation: "Require a JS asset for the current page/template.",
      arguments: [{ name: "path", type: "str" }],
      return: "None",
    },
  },
  dnd_area: {
    name: "dnd_area",
    signature: {
      documentation: "Start a drag-and-drop area.",
      arguments: [
        { name: "name", type: "str" },
        { name: "label", type: "str" },
      ],
      return: "None",
    },
  },
  dnd_section: {
    name: "dnd_section",
    signature: {
      documentation: "Start a drag-and-drop section.",
      arguments: [{ name: "full_width", type: "bool" }],
      return: "None",
    },
  },
  dnd_column: {
    name: "dnd_column",
    signature: {
      documentation: "Start a drag-and-drop column.",
      arguments: [{ name: "width", type: "int" }],
      return: "None",
    },
  },
}

/**
 * HubL globals + functions.
 * These are merged into [`SPECIAL_SYMBOLS.Program`](packages/server/src/constants.ts:8)
 * so they show up in symbol completion and hover.
 */
export const HUBL_PROGRAM_SYMBOLS: Record<
  string,
  string | TypeReference | TypeInfo | undefined
> = {
  // Common HubL context globals
  content: {
    name: "content",
    documentation:
      "The current content object (page/blog post/etc.). Shape varies by content type.",
    properties: {
      id: { type: "int" },
      name: { type: "str" },
      slug: { type: "str" },
      url: { type: "str" },
      absolute_url: { type: "str" },
      publish_date: { type: "int" },
    },
  },
  module: {
    name: "module",
    documentation:
      "In module templates, contains the current module fields. In other contexts it may be undefined.",
    properties: {
      // Keep permissive; module fields are user-defined.
    },
  },
  request: {
    name: "request",
    documentation: "Request context (URL, query params, etc.).",
    properties: {
      path: { type: "str" },
      query: { name: "dict" },
    },
  },
  site_settings: {
    name: "site_settings",
    documentation: "Portal/site settings.",
    properties: {
      company_name: { type: "str" },
      primary_domain: { type: "str" },
    },
  },
  theme: {
    name: "theme",
    documentation: "Theme context.",
    properties: {
      path: { type: "str" },
      name: { type: "str" },
    },
  },

  // Selected HubL functions (starter set)
  get_asset_url: {
    name: "function",
    signature: {
      documentation: "Resolve a theme/module asset path to a public URL.",
      arguments: [{ name: "path", type: "str" }],
      return: "str",
    },
  },
  resize_image_url: {
    name: "function",
    signature: {
      documentation:
        "Return a resized image URL for an image and desired dimensions.",
      arguments: [
        { name: "src", type: "str" },
        { name: "width", type: "int" },
        { name: "height", type: "int" },
      ],
      return: "str",
    },
  },
  hubdb_table: {
    name: "function",
    signature: {
      documentation: "Fetch HubDB table metadata.",
      arguments: [{ name: "table_id_or_name", type: "str" }],
      return: "dict",
    },
  },
  hubdb_table_rows: {
    name: "function",
    signature: {
      documentation: "Fetch rows from a HubDB table.",
      arguments: [
        { name: "table_id_or_name", type: "str" },
        { name: "query", type: "str", default: '""' },
      ],
      return: { name: "list", elementType: "dict" },
    },
  },
}

export const HUBL_FILTERS: Record<string, TypeInfo> = {
  // HubL has additional filters beyond core Jinja; keep the list minimal for now.
  // Add more as you encounter them in templates.
  escapejs: {
    name: "escapejs",
    signature: {
      documentation:
        "Escape a string for safe inclusion in JavaScript contexts.",
      arguments: [],
      return: "str",
    },
  },
  md5: {
    name: "md5",
    signature: {
      documentation: "Return an MD5 hash of the given string.",
      arguments: [],
      return: "str",
    },
  },
}
