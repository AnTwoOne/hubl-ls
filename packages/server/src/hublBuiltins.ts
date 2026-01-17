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
  "dnd_row",
  "dnd_module",

  // Content Tags
  "content_attribute",
  "global_partial",
  "header",

  // Form/CTA Tags
  "form",
  "cta",

  // Email Tags
  "email_subscriptions_confirmation",
  "unsubscribe_link",
  "view_as_page_link",

  // Blog Tags
  "blog_comments",
  "blog_social_sharing",
  "blog_subscribe",
  "post_filter",
  "post_listing",
  "related_blog_posts",

  // Menu/Navigation Tags
  "menu",
  "simple_menu",
  "language_switcher",

  // Asset Tags
  "linked_image",
  "logo",
  "password_prompt",

  // Script/Style Tags
  "style",
  "script",
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
  dnd_row: {
    name: "dnd_row",
    signature: {
      documentation:
        "Creates a drag-and-drop row within a dnd_section. Rows contain columns and help organize content horizontally.",
      arguments: [
        { name: "vertical_alignment", type: "str" },
        { name: "styles", type: "dict" },
      ],
      return: "None",
    },
  },
  dnd_module: {
    name: "dnd_module",
    signature: {
      documentation:
        "Renders a module within a drag-and-drop area. Used to place specific modules in DnD layouts.",
      arguments: [
        { name: "path", type: "str" },
        { name: "offset", type: "int" },
        { name: "width", type: "int" },
        { name: "flexbox_positioning", type: "str" },
      ],
      return: "None",
    },
  },

  // Content Tags
  content: {
    name: "content",
    signature: {
      documentation:
        "Renders a content area. Used in templates to define editable regions where content can be placed.",
      arguments: [{ name: "name", type: "str" }],
      return: "None",
    },
  },
  content_attribute: {
    name: "content_attribute",
    signature: {
      documentation:
        "Gets an attribute from a content object. Useful for accessing metadata or properties of content items.",
      arguments: [
        { name: "content_id", type: "int" },
        { name: "attribute", type: "str" },
      ],
      return: "None",
    },
  },
  global_partial: {
    name: "global_partial",
    signature: {
      documentation:
        "Includes a global partial template. Global partials are reusable template snippets available across all templates.",
      arguments: [{ name: "path", type: "str" }],
      return: "None",
    },
  },
  header: {
    name: "header",
    signature: {
      documentation:
        "Renders the header section of a page. Typically includes navigation, logo, and other header elements.",
      arguments: [],
      return: "None",
    },
  },
  footer: {
    name: "footer",
    signature: {
      documentation:
        "Renders the footer section of a page. Typically includes copyright, links, and other footer elements.",
      arguments: [],
      return: "None",
    },
  },

  // Form/CTA Tags
  form: {
    name: "form",
    signature: {
      documentation:
        "Renders a HubSpot form. Forms can be embedded in pages to collect visitor information.",
      arguments: [
        { name: "form_key", type: "str" },
        { name: "response_type", type: "str" },
        { name: "no_title", type: "bool" },
        { name: "no_wrapper", type: "bool" },
        { name: "follow_up_type_simple", type: "bool" },
        { name: "follow_up_type_smart", type: "bool" },
      ],
      return: "None",
    },
  },
  cta: {
    name: "cta",
    signature: {
      documentation:
        "Renders a Call-to-Action (CTA) button or link. CTAs are trackable elements that encourage visitor action.",
      arguments: [
        { name: "guid", type: "str" },
        { name: "embed_code", type: "bool" },
      ],
      return: "None",
    },
  },

  // Email Tags
  email_simple_subscription: {
    name: "email_simple_subscription",
    signature: {
      documentation:
        "Renders a simple email subscription form. Allows visitors to subscribe to email communications.",
      arguments: [
        { name: "header", type: "str" },
        { name: "input_help_text", type: "str" },
        { name: "button_text", type: "str" },
        { name: "input_placeholder", type: "str" },
      ],
      return: "None",
    },
  },
  email_subscriptions: {
    name: "email_subscriptions",
    signature: {
      documentation:
        "Renders an email subscription management interface. Allows contacts to manage their email preferences.",
      arguments: [
        { name: "header", type: "str" },
        { name: "subheader", type: "str" },
        { name: "button_text", type: "str" },
        { name: "resubscribe_button_text", type: "str" },
        { name: "unsubscribe_all_text", type: "str" },
      ],
      return: "None",
    },
  },
  email_subscriptions_confirmation: {
    name: "email_subscriptions_confirmation",
    signature: {
      documentation:
        "Renders a confirmation message after email subscription changes. Shows success/confirmation to the user.",
      arguments: [
        { name: "header", type: "str" },
        { name: "subheader", type: "str" },
      ],
      return: "None",
    },
  },
  unsubscribe_link: {
    name: "unsubscribe_link",
    signature: {
      documentation:
        "Renders an unsubscribe link for email templates. Required in marketing emails for compliance.",
      arguments: [{ name: "link_text", type: "str" }],
      return: "None",
    },
  },
  view_as_page_link: {
    name: "view_as_page_link",
    signature: {
      documentation:
        "Renders a 'view as web page' link for email templates. Allows recipients to view the email in a browser.",
      arguments: [{ name: "link_text", type: "str" }],
      return: "None",
    },
  },

  // Blog Tags
  blog_comments: {
    name: "blog_comments",
    signature: {
      documentation:
        "Renders the blog comments section. Displays existing comments and a form for new comments.",
      arguments: [
        { name: "select_blog", type: "str" },
        { name: "limit", type: "int" },
        { name: "skip_css", type: "bool" },
      ],
      return: "None",
    },
  },
  blog_social_sharing: {
    name: "blog_social_sharing",
    signature: {
      documentation:
        "Renders social sharing buttons for blog posts. Allows visitors to share content on social networks.",
      arguments: [{ name: "select_blog", type: "str" }],
      return: "None",
    },
  },
  blog_subscribe: {
    name: "blog_subscribe",
    signature: {
      documentation:
        "Renders a blog subscription form. Allows visitors to subscribe to blog updates via email.",
      arguments: [
        { name: "select_blog", type: "str" },
        { name: "title", type: "str" },
        { name: "response_message", type: "str" },
        { name: "button_text", type: "str" },
        { name: "input_placeholder", type: "str" },
      ],
      return: "None",
    },
  },
  post_filter: {
    name: "post_filter",
    signature: {
      documentation:
        "Renders a blog post filter. Allows visitors to filter blog posts by various criteria.",
      arguments: [
        { name: "select_blog", type: "str" },
        { name: "filter_type", type: "str" },
        { name: "expand_link_text", type: "str" },
        { name: "max_links", type: "int" },
      ],
      return: "None",
    },
  },
  post_listing: {
    name: "post_listing",
    signature: {
      documentation:
        "Renders a listing of blog posts. Displays multiple blog posts with configurable layout and pagination.",
      arguments: [
        { name: "select_blog", type: "str" },
        { name: "limit", type: "int" },
        { name: "listing_type", type: "str" },
        { name: "include_featured_image", type: "bool" },
      ],
      return: "None",
    },
  },
  related_blog_posts: {
    name: "related_blog_posts",
    signature: {
      documentation:
        "Renders a list of related blog posts. Shows posts related to the current post based on tags or content.",
      arguments: [
        { name: "select_blog", type: "str" },
        { name: "limit", type: "int" },
        { name: "post_formatter", type: "str" },
        { name: "title", type: "str" },
        { name: "no_wrapper", type: "bool" },
      ],
      return: "None",
    },
  },

  // Menu/Navigation Tags
  menu: {
    name: "menu",
    signature: {
      documentation:
        "Renders a navigation menu. Supports hierarchical menus with multiple levels and various display options.",
      arguments: [
        { name: "menu_id", type: "str" },
        { name: "root_type", type: "str" },
        { name: "flyouts", type: "bool" },
        { name: "max_levels", type: "int" },
        { name: "flow", type: "str" },
        { name: "label", type: "str" },
      ],
      return: "None",
    },
  },
  simple_menu: {
    name: "simple_menu",
    signature: {
      documentation:
        "Renders a simple flat navigation menu. A simpler alternative to the full menu tag for basic navigation.",
      arguments: [
        { name: "menu_id", type: "str" },
        { name: "label", type: "str" },
        { name: "orientation", type: "str" },
      ],
      return: "None",
    },
  },
  language_switcher: {
    name: "language_switcher",
    signature: {
      documentation:
        "Renders a language switcher for multi-language sites. Allows visitors to switch between available languages.",
      arguments: [
        { name: "display_mode", type: "str" },
        { name: "label", type: "str" },
      ],
      return: "None",
    },
  },

  // Asset Tags
  linked_image: {
    name: "linked_image",
    signature: {
      documentation:
        "Renders an image wrapped in a link. Useful for clickable images that navigate to other pages.",
      arguments: [
        { name: "src", type: "str" },
        { name: "link", type: "str" },
        { name: "alt", type: "str" },
        { name: "open_in_new_tab", type: "bool" },
        { name: "width", type: "int" },
        { name: "height", type: "int" },
      ],
      return: "None",
    },
  },
  logo: {
    name: "logo",
    signature: {
      documentation:
        "Renders the site logo. Automatically uses the logo configured in site settings.",
      arguments: [
        { name: "src", type: "str" },
        { name: "alt", type: "str" },
        { name: "width", type: "int" },
        { name: "height", type: "int" },
        { name: "link", type: "str" },
        { name: "open_in_new_tab", type: "bool" },
        { name: "suppress_company_name", type: "bool" },
      ],
      return: "None",
    },
  },
  google_search: {
    name: "google_search",
    signature: {
      documentation:
        "Renders a Google Custom Search box. Enables site search powered by Google.",
      arguments: [
        { name: "search_field_label", type: "str" },
        { name: "search_button_text", type: "str" },
        { name: "results_page_url", type: "str" },
      ],
      return: "None",
    },
  },
  password_prompt: {
    name: "password_prompt",
    signature: {
      documentation:
        "Renders a password prompt for protected pages. Used on password-protected content.",
      arguments: [
        { name: "submit_button_text", type: "str" },
        { name: "password_placeholder", type: "str" },
        { name: "bad_password_message", type: "str" },
      ],
      return: "None",
    },
  },

  // Script/Style Tags
  style: {
    name: "style",
    signature: {
      documentation:
        "Renders inline CSS styles. Content between tags is treated as CSS and included in the page.",
      arguments: [],
      return: "None",
    },
  },
  script: {
    name: "script",
    signature: {
      documentation:
        "Renders inline JavaScript. Content between tags is treated as JavaScript and included in the page.",
      arguments: [],
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

  // Blog Functions
  blog_recent_posts: {
    name: "function",
    signature: {
      documentation:
        "Returns a sequence of blog post objects for the specified blog, sorted by most recent first.",
      arguments: [
        { name: "selected_blog", type: "str" },
        { name: "limit", type: "int", default: "3" },
      ],
      return: { name: "list", elementType: "dict" },
    },
  },
  blog_recent_tag_posts: {
    name: "function",
    signature: {
      documentation:
        "Returns a sequence of blog post objects for a specified blog that have a specified tag, sorted by most recent first.",
      arguments: [
        { name: "selected_blog", type: "str" },
        { name: "tag_slug", type: "str" },
        { name: "limit", type: "int", default: "3" },
      ],
      return: { name: "list", elementType: "dict" },
    },
  },
  blog_recent_author_posts: {
    name: "function",
    signature: {
      documentation:
        "Returns a sequence of blog post objects for a specified blog by a specified author, sorted by most recent first.",
      arguments: [
        { name: "selected_blog", type: "str" },
        { name: "author_slug", type: "str" },
        { name: "limit", type: "int", default: "3" },
      ],
      return: { name: "list", elementType: "dict" },
    },
  },
  blog_popular_posts: {
    name: "function",
    signature: {
      documentation:
        "Returns a sequence of blog post objects for the specified blog, sorted by most popular first based on views.",
      arguments: [
        { name: "selected_blog", type: "str" },
        { name: "limit", type: "int", default: "3" },
        { name: "time_frame", type: "str", default: '"popular_all_time"' },
      ],
      return: { name: "list", elementType: "dict" },
    },
  },
  blog_all_posts_url: {
    name: "function",
    signature: {
      documentation:
        "Returns the URL to the listing page of all posts for the specified blog.",
      arguments: [{ name: "selected_blog", type: "str" }],
      return: "str",
    },
  },
  blog_tag_url: {
    name: "function",
    signature: {
      documentation:
        "Returns the URL to the specified tag's listing page for the specified blog.",
      arguments: [
        { name: "selected_blog", type: "str" },
        { name: "tag_slug", type: "str" },
      ],
      return: "str",
    },
  },
  blog_author_url: {
    name: "function",
    signature: {
      documentation:
        "Returns the URL to the specified author's listing page for the specified blog.",
      arguments: [
        { name: "selected_blog", type: "str" },
        { name: "author_slug", type: "str" },
      ],
      return: "str",
    },
  },
  blog_authors: {
    name: "function",
    signature: {
      documentation:
        "Returns a sequence of blog author objects for the specified blog.",
      arguments: [
        { name: "selected_blog", type: "str" },
        { name: "limit", type: "int", default: "250" },
      ],
      return: { name: "list", elementType: "dict" },
    },
  },
  blog_by_id: {
    name: "function",
    signature: {
      documentation: "Returns a blog object by ID.",
      arguments: [{ name: "blog_id", type: "int" }],
      return: "dict",
    },
  },
  blog_page_link: {
    name: "function",
    signature: {
      documentation:
        "Creates pagination links for blog listing templates. Returns URL for the specified page number.",
      arguments: [{ name: "page", type: "int" }],
      return: "str",
    },
  },
  blog_post_archive_url: {
    name: "function",
    signature: {
      documentation:
        "Returns the URL to the archive listing page for the given date values.",
      arguments: [
        { name: "selected_blog", type: "str" },
        { name: "year", type: "int" },
        { name: "month", type: "int", default: "undefined" },
        { name: "day", type: "int", default: "undefined" },
      ],
      return: "str",
    },
  },
  blog_tags: {
    name: "function",
    signature: {
      documentation:
        "Returns a sequence of the 250 most blogged-about tags for the specified blog.",
      arguments: [
        { name: "selected_blog", type: "str" },
        { name: "limit", type: "int", default: "250" },
      ],
      return: { name: "list", elementType: "dict" },
    },
  },
  blog_total_post_count: {
    name: "function",
    signature: {
      documentation:
        "Returns the total number of published posts in the specified blog.",
      arguments: [{ name: "selected_blog", type: "str", default: "undefined" }],
      return: "int",
    },
  },

  // Content Functions
  content_by_id: {
    name: "function",
    signature: {
      documentation:
        "Returns a landing page, website page, or blog post by ID.",
      arguments: [{ name: "id", type: "int" }],
      return: "dict",
    },
  },
  content_by_ids: {
    name: "function",
    signature: {
      documentation:
        "Returns a list of landing pages, website pages, or blog posts by their IDs.",
      arguments: [{ name: "ids", type: { name: "list", elementType: "int" } }],
      return: { name: "list", elementType: "dict" },
    },
  },
  crm_object: {
    name: "function",
    signature: {
      documentation:
        "Returns a single CRM object by type and ID. Can specify which properties to return.",
      arguments: [
        { name: "object_type", type: "str" },
        { name: "object_id", type: "str" },
        { name: "properties", type: "str", default: '""' },
        { name: "formatting", type: "bool", default: "false" },
      ],
      return: "dict",
    },
  },
  crm_objects: {
    name: "function",
    signature: {
      documentation:
        "Returns a list of CRM objects by type with optional query and properties.",
      arguments: [
        { name: "object_type", type: "str" },
        { name: "query", type: "str", default: '""' },
        { name: "properties", type: "str", default: '""' },
        { name: "formatting", type: "bool", default: "false" },
      ],
      return: { name: "list", elementType: "dict" },
    },
  },
  crm_associations: {
    name: "function",
    signature: {
      documentation:
        "Returns a list of associated CRM objects for a given object.",
      arguments: [
        { name: "object_id", type: "str" },
        { name: "from_object_type", type: "str" },
        { name: "to_object_type", type: "str" },
        { name: "query", type: "str", default: '""' },
      ],
      return: { name: "list", elementType: "dict" },
    },
  },

  // Menu/Navigation Functions
  menu: {
    name: "function",
    signature: {
      documentation:
        "Returns a menu object by ID or name. Use to build custom navigation.",
      arguments: [
        { name: "menu_id_or_name", type: "str" },
        { name: "root_type", type: "str", default: '"site_root"' },
      ],
      return: "dict",
    },
  },
  simple_menu: {
    name: "function",
    signature: {
      documentation:
        "Returns a simple menu object by ID or name with a flat structure.",
      arguments: [{ name: "menu_id_or_name", type: "str" }],
      return: "dict",
    },
  },

  // Form Functions
  form: {
    name: "function",
    signature: {
      documentation:
        "Renders a HubSpot form by form ID or GUID. Returns HTML markup.",
      arguments: [
        { name: "form_id", type: "str" },
        { name: "response_type", type: "str", default: '"inline"' },
        { name: "no_title", type: "bool", default: "false" },
        { name: "no_wrapper", type: "bool", default: "false" },
      ],
      return: "str",
    },
  },

  // URL/Path Functions
  get_public_template_url: {
    name: "function",
    signature: {
      documentation: "Returns the public URL for a template file by path.",
      arguments: [{ name: "path", type: "str" }],
      return: "str",
    },
  },
  get_public_template_url_by_id: {
    name: "function",
    signature: {
      documentation: "Returns the public URL for a template file by its ID.",
      arguments: [{ name: "template_id", type: "int" }],
      return: "str",
    },
  },

  // Utility Functions
  range: {
    name: "function",
    signature: {
      documentation:
        "Returns a list containing an arithmetic progression of integers. Similar to Python's range().",
      arguments: [
        { name: "start", type: "int" },
        { name: "stop", type: "int", default: "undefined" },
        { name: "step", type: "int", default: "1" },
      ],
      return: { name: "list", elementType: "int" },
    },
  },
  today: {
    name: "function",
    signature: {
      documentation:
        "Returns the current date as a datetime object. Can be formatted with datetimeformat filter.",
      arguments: [{ name: "timezone", type: "str", default: '"utc"' }],
      return: "datetime",
    },
  },
  unixtimestamp: {
    name: "function",
    signature: {
      documentation: "Returns the current Unix timestamp in milliseconds.",
      arguments: [],
      return: "int",
    },
  },
  datetimeformat: {
    name: "function",
    signature: {
      documentation:
        "Formats a datetime value using the specified format string.",
      arguments: [
        { name: "datetime", type: "datetime" },
        { name: "format", type: "str", default: '"%Y-%m-%d"' },
        { name: "timezone", type: "str", default: '"utc"' },
      ],
      return: "str",
    },
  },
  personalization_token: {
    name: "function",
    signature: {
      documentation:
        "Returns a personalization token value for the current contact, with a default fallback.",
      arguments: [
        { name: "token_path", type: "str" },
        { name: "default", type: "str" },
      ],
      return: "str",
    },
  },
  require_head: {
    name: "function",
    signature: {
      documentation:
        "Adds content to the <head> section of the page. Useful for adding meta tags or scripts.",
      arguments: [{ name: "content", type: "str" }],
      return: "None",
    },
  },
  require_css: {
    name: "function",
    signature: {
      documentation:
        "Requires a CSS file to be loaded on the page. Can be used as a function or tag.",
      arguments: [
        { name: "path", type: "str" },
        { name: "async", type: "bool", default: "false" },
      ],
      return: "None",
    },
  },
  require_js: {
    name: "function",
    signature: {
      documentation:
        "Requires a JavaScript file to be loaded on the page. Can be used as a function or tag.",
      arguments: [
        { name: "path", type: "str" },
        { name: "position", type: "str", default: '"footer"' },
        { name: "async", type: "bool", default: "false" },
        { name: "defer", type: "bool", default: "false" },
      ],
      return: "None",
    },
  },

  // Color Functions
  color_variant: {
    name: "function",
    signature: {
      documentation:
        "Returns a color variant (lighter or darker) of the given color by the specified amount.",
      arguments: [
        { name: "color", type: "str" },
        { name: "amount", type: "int" },
      ],
      return: "str",
    },
  },

  // Standard includes
  standard_header_includes: {
    name: "function",
    signature: {
      documentation:
        "Renders standard HubSpot tracking code and scripts in the <head>. Required in all templates.",
      arguments: [],
      return: "str",
    },
  },
  standard_footer_includes: {
    name: "function",
    signature: {
      documentation:
        "Renders standard HubSpot footer code and scripts before </body>. Required in all templates.",
      arguments: [],
      return: "str",
    },
  },
}

export const HUBL_FILTERS: Record<string, TypeInfo> = {
  // HubL-specific filters beyond core template filters.
  // Reference: https://developers.hubspot.com/docs/cms/reference/hubl/filters

  // === Existing filters ===
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

  // === String Filters ===
  cut: {
    name: "cut",
    signature: {
      documentation:
        "Removes all occurrences of a specified substring from a string.",
      arguments: [{ name: "characters", type: "str" }],
      return: "str",
    },
  },
  ipaddr: {
    name: "ipaddr",
    signature: {
      documentation:
        "Evaluates to true if the value is a valid IPv4 or IPv6 address.",
      arguments: [],
      return: "bool",
    },
  },
  regex_replace: {
    name: "regex_replace",
    signature: {
      documentation:
        "Searches for a regex pattern and replaces with a sequence of characters.",
      arguments: [
        { name: "regex", type: "str" },
        { name: "replacement", type: "str" },
      ],
      return: "str",
    },
  },
  render: {
    name: "render",
    signature: {
      documentation:
        "Renders a string as HubL. Useful for rendering content that contains HubL code stored in a variable.",
      arguments: [],
      return: "str",
    },
  },
  sanitize_html: {
    name: "sanitize_html",
    signature: {
      documentation:
        "Sanitizes HTML content by removing potentially dangerous tags and attributes while preserving safe HTML.",
      arguments: [],
      return: "str",
    },
  },
  split: {
    name: "split",
    signature: {
      documentation:
        "Splits a string into a list of substrings based on a delimiter.",
      arguments: [
        { name: "delimiter", type: "str" },
        { name: "limit", type: "int", default: "undefined" },
      ],
      return: { name: "list", elementType: "str" },
    },
  },
  truncatehtml: {
    name: "truncatehtml",
    signature: {
      documentation:
        "Truncates HTML content to a specified length while preserving HTML tags and structure.",
      arguments: [
        { name: "length", type: "int" },
        { name: "end", type: "str", default: '"..."' },
        { name: "breakword", type: "bool", default: "false" },
      ],
      return: "str",
    },
  },

  // === Number/Math Filters ===
  divide: {
    name: "divide",
    signature: {
      documentation: "Divides the value by the given number.",
      arguments: [{ name: "divisor", type: "float" }],
      return: "float",
    },
  },
  minus: {
    name: "minus",
    signature: {
      documentation: "Subtracts the given number from the value.",
      arguments: [{ name: "number", type: "float" }],
      return: "float",
    },
  },
  plus: {
    name: "plus",
    signature: {
      documentation: "Adds the given number to the value.",
      arguments: [{ name: "number", type: "float" }],
      return: "float",
    },
  },
  times: {
    name: "times",
    signature: {
      documentation: "Multiplies the value by the given number.",
      arguments: [{ name: "multiplier", type: "float" }],
      return: "float",
    },
  },
  format_currency: {
    name: "format_currency",
    signature: {
      documentation:
        "Formats a number as currency with the specified locale and currency code.",
      arguments: [
        { name: "locale", type: "str" },
        { name: "currency", type: "str", default: '"USD"' },
      ],
      return: "str",
    },
  },
  format_number: {
    name: "format_number",
    signature: {
      documentation:
        "Formats a number with locale-specific formatting (thousands separators, decimal points).",
      arguments: [{ name: "locale", type: "str", default: '"en-US"' }],
      return: "str",
    },
  },

  // === Date/Time Filters ===
  datetimeformat: {
    name: "datetimeformat",
    signature: {
      documentation:
        "Formats a datetime value using the specified format string and timezone.",
      arguments: [
        { name: "format", type: "str", default: '"%Y-%m-%d"' },
        { name: "timezone", type: "str", default: '"utc"' },
        { name: "locale", type: "str", default: '"en"' },
      ],
      return: "str",
    },
  },
  strtotime: {
    name: "strtotime",
    signature: {
      documentation:
        "Converts a datetime string to a timestamp (milliseconds since epoch).",
      arguments: [{ name: "format", type: "str" }],
      return: "int",
    },
  },
  between_times: {
    name: "between_times",
    signature: {
      documentation:
        "Checks if a datetime value falls between two other datetime values.",
      arguments: [
        { name: "start", type: "datetime" },
        { name: "end", type: "datetime" },
      ],
      return: "bool",
    },
  },
  format_date: {
    name: "format_date",
    signature: {
      documentation:
        "Formats a date value using the specified format and locale.",
      arguments: [
        { name: "format", type: "str", default: '"short"' },
        { name: "timezone", type: "str", default: '"utc"' },
        { name: "locale", type: "str", default: '"en"' },
      ],
      return: "str",
    },
  },
  format_datetime: {
    name: "format_datetime",
    signature: {
      documentation:
        "Formats a datetime value using the specified format and locale.",
      arguments: [
        { name: "format", type: "str", default: '"short"' },
        { name: "timezone", type: "str", default: '"utc"' },
        { name: "locale", type: "str", default: '"en"' },
      ],
      return: "str",
    },
  },
  format_time: {
    name: "format_time",
    signature: {
      documentation:
        "Formats a time value using the specified format and locale.",
      arguments: [
        { name: "format", type: "str", default: '"short"' },
        { name: "timezone", type: "str", default: '"utc"' },
        { name: "locale", type: "str", default: '"en"' },
      ],
      return: "str",
    },
  },
  unixtimestamp: {
    name: "unixtimestamp",
    signature: {
      documentation:
        "Converts a datetime value to a Unix timestamp (milliseconds since epoch).",
      arguments: [],
      return: "int",
    },
  },

  // === Content Filters ===
  fromjson: {
    name: "fromjson",
    signature: {
      documentation:
        "Parses a JSON string and returns the corresponding object or array.",
      arguments: [],
      return: "dict",
    },
  },

  // === Blog/Content Filters ===
  blog_post_archive_url: {
    name: "blog_post_archive_url",
    signature: {
      documentation:
        "Returns the URL for the blog post archive page for a given date.",
      arguments: [
        { name: "year", type: "int" },
        { name: "month", type: "int", default: "undefined" },
      ],
      return: "str",
    },
  },
  blog_tag_url: {
    name: "blog_tag_url",
    signature: {
      documentation:
        "Returns the URL for a blog tag listing page. Used with a blog tag object.",
      arguments: [{ name: "blog_id", type: "str" }],
      return: "str",
    },
  },

  // === Conversion Filters ===
  bool: {
    name: "bool",
    signature: {
      documentation:
        "Converts a value to a boolean. Returns true for truthy values, false otherwise.",
      arguments: [],
      return: "bool",
    },
  },

  // === Additional HubL Filters ===
  base64_encode: {
    name: "base64_encode",
    signature: {
      documentation: "Encodes a string to Base64 format.",
      arguments: [],
      return: "str",
    },
  },
  base64_decode: {
    name: "base64_decode",
    signature: {
      documentation: "Decodes a Base64 encoded string.",
      arguments: [],
      return: "str",
    },
  },
  geo_distance: {
    name: "geo_distance",
    signature: {
      documentation:
        "Calculates the distance between two geographic coordinates.",
      arguments: [
        { name: "lat1", type: "float" },
        { name: "lon1", type: "float" },
        { name: "lat2", type: "float" },
        { name: "lon2", type: "float" },
        { name: "unit", type: "str", default: '"mi"' },
      ],
      return: "float",
    },
  },
  log: {
    name: "log",
    signature: {
      documentation:
        "Logs the value to the developer console for debugging purposes.",
      arguments: [{ name: "label", type: "str", default: '""' }],
      return: "str",
    },
  },
  root: {
    name: "root",
    signature: {
      documentation:
        "Calculates the nth root of a number. Default is square root.",
      arguments: [{ name: "n", type: "int", default: "2" }],
      return: "float",
    },
  },
  to_local_time: {
    name: "to_local_time",
    signature: {
      documentation: "Converts a UTC datetime to the specified timezone.",
      arguments: [{ name: "timezone", type: "str" }],
      return: "datetime",
    },
  },
  shuffle: {
    name: "shuffle",
    signature: {
      documentation:
        "Randomly shuffles the elements of a list and returns a new list.",
      arguments: [],
      return: "list",
    },
  },
  symmetric_difference: {
    name: "symmetric_difference",
    signature: {
      documentation:
        "Returns elements that are in either list but not in both (XOR operation).",
      arguments: [{ name: "other_list", type: "list" }],
      return: "list",
    },
  },
  union: {
    name: "union",
    signature: {
      documentation:
        "Returns a list containing all unique elements from both lists.",
      arguments: [{ name: "other_list", type: "list" }],
      return: "list",
    },
  },
  intersect: {
    name: "intersect",
    signature: {
      documentation:
        "Returns a list containing only elements that exist in both lists.",
      arguments: [{ name: "other_list", type: "list" }],
      return: "list",
    },
  },
  difference: {
    name: "difference",
    signature: {
      documentation:
        "Returns elements that are in the first list but not in the second list.",
      arguments: [{ name: "other_list", type: "list" }],
      return: "list",
    },
  },
  sort_natural: {
    name: "sort_natural",
    signature: {
      documentation:
        "Sorts a list using natural sort order (e.g., 'item2' comes before 'item10').",
      arguments: [
        { name: "reverse", type: "bool", default: "false" },
        { name: "attribute", type: "str", default: "undefined" },
      ],
      return: "list",
    },
  },
  convert_rgb: {
    name: "convert_rgb",
    signature: {
      documentation: "Converts a HEX color value to RGB format.",
      arguments: [],
      return: "str",
    },
  },
  cta: {
    name: "cta",
    signature: {
      documentation: "Renders a CTA (Call-to-Action) by its GUID.",
      arguments: [{ name: "embed_code", type: "bool", default: "false" }],
      return: "str",
    },
  },
  menu: {
    name: "menu",
    signature: {
      documentation: "Renders a navigation menu by ID.",
      arguments: [
        { name: "root_type", type: "str", default: '"site_root"' },
        { name: "flyouts", type: "bool", default: "true" },
        { name: "max_levels", type: "int", default: "2" },
        { name: "flow", type: "str", default: '"horizontal"' },
      ],
      return: "str",
    },
  },
  module_asset_url: {
    name: "module_asset_url",
    signature: {
      documentation:
        "Returns the URL for an asset within a module's directory.",
      arguments: [{ name: "path", type: "str" }],
      return: "str",
    },
  },
  content_attribute: {
    name: "content_attribute",
    signature: {
      documentation: "Gets an attribute from a content object by ID.",
      arguments: [
        { name: "content_id", type: "int" },
        { name: "attribute", type: "str" },
      ],
      return: "str",
    },
  },

  // === Common Jinja2/HubL Filters (Priority 1) ===

  // String Operation Filters
  capitalize: {
    name: "capitalize",
    signature: {
      documentation: "Uppercase the first character, lowercase the rest.",
      arguments: [],
      return: "str",
    },
  },
  lower: {
    name: "lower",
    signature: {
      documentation: "Convert all letters in the value to lowercase.",
      arguments: [],
      return: "str",
    },
  },
  upper: {
    name: "upper",
    signature: {
      documentation: "Convert all letters in the value to uppercase.",
      arguments: [],
      return: "str",
    },
  },
  title: {
    name: "title",
    signature: {
      documentation: "Capitalize the first letter of each word.",
      arguments: [],
      return: "str",
    },
  },
  trim: {
    name: "trim",
    signature: {
      documentation: "Remove leading and trailing whitespace.",
      arguments: [],
      return: "str",
    },
  },
  truncate: {
    name: "truncate",
    signature: {
      documentation:
        "Truncate a string to a specified length. If truncated, adds an ellipsis.",
      arguments: [
        { name: "length", type: "int", default: "255" },
        { name: "killwords", type: "bool", default: "false" },
        { name: "end", type: "str", default: '"..."' },
      ],
      return: "str",
    },
  },
  replace: {
    name: "replace",
    signature: {
      documentation: "Replace all instances of a substring with another string.",
      arguments: [
        { name: "old", type: "str" },
        { name: "new", type: "str" },
        { name: "count", type: "int", default: "undefined" },
      ],
      return: "str",
    },
  },
  wordcount: {
    name: "wordcount",
    signature: {
      documentation: "Count the number of words in a string.",
      arguments: [],
      return: "int",
    },
  },
  striptags: {
    name: "striptags",
    signature: {
      documentation: "Remove HTML tags from content.",
      arguments: [],
      return: "str",
    },
  },
  urlencode: {
    name: "urlencode",
    signature: {
      documentation: "Encode a string for safe URL usage.",
      arguments: [],
      return: "str",
    },
  },
  urldecode: {
    name: "urldecode",
    signature: {
      documentation: "Decode a URL-encoded string.",
      arguments: [],
      return: "str",
    },
  },
  safe: {
    name: "safe",
    signature: {
      documentation:
        "Mark a value as safe from HTML escaping. Use with caution.",
      arguments: [],
      return: "str",
    },
  },

  // Sequence Operation Filters
  first: {
    name: "first",
    signature: {
      documentation: "Return the first item of a sequence.",
      arguments: [],
      return: "Any",
    },
  },
  last: {
    name: "last",
    signature: {
      documentation: "Return the last item of a sequence.",
      arguments: [],
      return: "Any",
    },
  },
  length: {
    name: "length",
    signature: {
      documentation:
        "Return the number of items in a sequence or mapping, or the length of a string.",
      arguments: [],
      return: "int",
    },
  },
  reverse: {
    name: "reverse",
    signature: {
      documentation: "Reverse a sequence or iterator.",
      arguments: [],
      return: "list",
    },
  },
  sort: {
    name: "sort",
    signature: {
      documentation: "Sort an iterable.",
      arguments: [
        { name: "reverse", type: "bool", default: "false" },
        { name: "case_sensitive", type: "bool", default: "false" },
        { name: "attribute", type: "str", default: "undefined" },
      ],
      return: "list",
    },
  },
  join: {
    name: "join",
    signature: {
      documentation: "Concatenate a sequence of strings with a delimiter.",
      arguments: [
        { name: "delimiter", type: "str", default: '""' },
        { name: "attribute", type: "str", default: "undefined" },
      ],
      return: "str",
    },
  },
  unique: {
    name: "unique",
    signature: {
      documentation: "Remove duplicate items from a sequence.",
      arguments: [{ name: "attribute", type: "str", default: "undefined" }],
      return: "list",
    },
  },
  sum: {
    name: "sum",
    signature: {
      documentation: "Calculate the sum of a sequence of numbers.",
      arguments: [
        { name: "attribute", type: "str", default: "undefined" },
        { name: "start", type: "int", default: "0" },
      ],
      return: "int",
    },
  },

  // Type Conversion Filters
  int: {
    name: "int",
    signature: {
      documentation: "Convert a value to an integer.",
      arguments: [{ name: "default", type: "int", default: "0" }],
      return: "int",
    },
  },
  float: {
    name: "float",
    signature: {
      documentation: "Convert a value to a floating point number.",
      arguments: [{ name: "default", type: "float", default: "0.0" }],
      return: "float",
    },
  },
  string: {
    name: "string",
    signature: {
      documentation: "Convert a value to its string representation.",
      arguments: [],
      return: "str",
    },
  },
  list: {
    name: "list",
    signature: {
      documentation: "Convert a value to a list.",
      arguments: [],
      return: "list",
    },
  },

  // Numeric Operation Filters
  abs: {
    name: "abs",
    signature: {
      documentation: "Return the absolute value of a number.",
      arguments: [],
      return: "int",
    },
  },
  round: {
    name: "round",
    signature: {
      documentation: "Round a number to a given precision.",
      arguments: [
        { name: "precision", type: "int", default: "0" },
        { name: "method", type: "str", default: '"common"' },
      ],
      return: "float",
    },
  },
  default: {
    name: "default",
    signature: {
      documentation:
        "Return the default value if the variable is undefined or falsy.",
      arguments: [
        { name: "default_value", type: "Any" },
        { name: "boolean", type: "bool", default: "false" },
      ],
      return: "Any",
    },
  },

  // Advanced Filters
  groupby: {
    name: "groupby",
    signature: {
      documentation: "Group a sequence of objects by a common attribute.",
      arguments: [{ name: "attribute", type: "str" }],
      return: "list",
    },
  },
  map: {
    name: "map",
    signature: {
      documentation:
        "Apply a filter to a sequence of objects or look up an attribute.",
      arguments: [
        { name: "filter_or_attribute", type: "str" },
        { name: "args", type: "Any", default: "undefined" },
      ],
      return: "list",
    },
  },
  select: {
    name: "select",
    signature: {
      documentation: "Filter a sequence of objects by a test expression.",
      arguments: [{ name: "test", type: "str" }],
      return: "list",
    },
  },
  reject: {
    name: "reject",
    signature: {
      documentation:
        "Filter a sequence of objects by rejecting those matching a test.",
      arguments: [{ name: "test", type: "str" }],
      return: "list",
    },
  },
  selectattr: {
    name: "selectattr",
    signature: {
      documentation: "Filter a sequence of objects by testing an attribute.",
      arguments: [
        { name: "attribute", type: "str" },
        { name: "test", type: "str", default: "undefined" },
        { name: "value", type: "Any", default: "undefined" },
      ],
      return: "list",
    },
  },
  rejectattr: {
    name: "rejectattr",
    signature: {
      documentation:
        "Filter a sequence of objects by rejecting those where an attribute matches.",
      arguments: [
        { name: "attribute", type: "str" },
        { name: "test", type: "str", default: "undefined" },
        { name: "value", type: "Any", default: "undefined" },
      ],
      return: "list",
    },
  },
  batch: {
    name: "batch",
    signature: {
      documentation: "Batch items into groups of a specified size.",
      arguments: [
        { name: "linecount", type: "int" },
        { name: "fill_with", type: "Any", default: "undefined" },
      ],
      return: "list",
    },
  },

  // Date/Time Filters
  format_currency_value: {
    name: "format_currency_value",
    signature: {
      documentation:
        "Formats a number as currency per locale. Supports locale codes (e.g. 'en-US'), currency codes (e.g. 'USD'), and decimal digit control.",
      arguments: [
        { name: "locale", type: "str" },
        { name: "currency", type: "str" },
        { name: "minDecimalDigits", type: "int", default: "2" },
        { name: "maxDecimalDigits", type: "int", default: "2" },
      ],
      return: "str",
    },
  },
  minus_time: {
    name: "minus_time",
    signature: {
      documentation:
        "Subtracts time from a datetime object. Time unit can be 'years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'.",
      arguments: [
        { name: "diff", type: "int" },
        { name: "timeunit", type: "str" },
      ],
      return: "datetime",
    },
  },
  plus_time: {
    name: "plus_time",
    signature: {
      documentation:
        "Adds time to a datetime object. Time unit can be 'years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'.",
      arguments: [
        { name: "diff", type: "int" },
        { name: "timeunit", type: "str" },
      ],
      return: "datetime",
    },
  },
  strtodate: {
    name: "strtodate",
    signature: {
      documentation:
        "Parses a string to a date object using a format string. Uses Java SimpleDateFormat patterns.",
      arguments: [{ name: "format", type: "str" }],
      return: "datetime",
    },
  },

  // Numeric Filters
  add: {
    name: "add",
    signature: {
      documentation: "Adds a number to the value.",
      arguments: [{ name: "number", type: "int" }],
      return: "int",
    },
  },
  multiply: {
    name: "multiply",
    signature: {
      documentation: "Multiplies the value by a number.",
      arguments: [{ name: "multiplier", type: "int" }],
      return: "int",
    },
  },
}
