# HubL Built-ins Expansion TODO

This document lists HubL built-ins from HubSpot documentation that should be added to `/packages/server/src/hublBuiltins.ts`.

Based on analysis of HubSpot's official documentation (2026-01):

- https://developers.hubspot.com/docs/cms/reference/hubl/functions
- https://developers.hubspot.com/docs/cms/reference/hubl/filters
- https://developers.hubspot.com/docs/cms/reference/hubl/tags/standard-tags
- https://developers.hubspot.com/docs/cms/reference/hubl/tags/dnd-areas

## ✅ Priority 1: Common Jinja2/HubL Filters (COMPLETED - v0.1.0)

The following 35 filters have been added to `HUBL_FILTERS`:

**✅ String Operations:** capitalize, lower, upper, title, trim, truncate, replace, wordcount, striptags, urlencode, urldecode, safe

**✅ Sequence Operations:** first, last, length, reverse, sort, join, unique, sum

**✅ Type Conversions:** int, float, string, list, bool

**✅ Numeric Operations:** abs, round, default

**✅ Advanced Filters:** groupby, map, select, reject, selectattr, rejectattr, batch

**Still TODO (lower priority):**

- `min`, `max` - Min/max values
- `xmlattr` - Format as XML attributes
- `filesizeformat` - Format as file size
- `dictsort` - Sort dictionary
- `center` - Center text
- `indent` - Indent text (exists in runtime but not exposed)
- `wordwrap` - Wrap text
- `forceescape` - Force escape
- `format` - String formatting
- `pprint` - Pretty print
- `slice` - Slice into batches
- `random` - Random item

## ✅ Priority 2: Blog Functions (COMPLETED - v0.1.0)

The following 6 blog functions have been added to `HUBL_PROGRAM_SYMBOLS`:

**✅ Added:** blog_authors, blog_by_id, blog_page_link, blog_post_archive_url, blog_tags, blog_total_post_count

Original specification:

```typescript
blog_authors: {
  name: "function",
  signature: {
    documentation: "Returns a sequence of blog author objects for the specified blog.",
    arguments: [
      { name: "selected_blog", type: "str" },
      { name: "limit", type: "int", default: "250" }
    ],
    return: { name: "list", elementType: "dict" }
  }
},
blog_by_id: {
  name: "function",
  signature: {
    documentation: "Returns a blog by ID.",
    arguments: [{ name: "selected_blog", type: "str|int" }],
    return: "dict"
  }
},
blog_page_link: {
  name: "function",
  signature: {
    documentation: "Creates pagination links for blog listing templates.",
    arguments: [{ name: "page", type: "int" }],
    return: "str"
  }
},
blog_post_archive_url: {
  name: "function",
  signature: {
    documentation: "Returns URL to archive listing page for given date values.",
    arguments: [
      { name: "selected_blog", type: "str" },
      { name: "year", type: "int" },
      { name: "month", type: "int", default: "undefined" },
      { name: "day", type: "int", default: "undefined" }
    ],
    return: "str"
  }
},
blog_tags: {
  name: "function",
  signature: {
    documentation: "Returns a sequence of the 250 most blogged-about tags for the specified blog.",
    arguments: [
      { name: "selected_blog", type: "str" },
      { name: "limit", type: "int", default: "250" }
    ],
    return: { name: "list", elementType: "dict" }
  }
},
blog_total_post_count: {
  name: "function",
  signature: {
    documentation: "Returns the total number of published posts in the specified blog.",
    arguments: [{ name: "selected_blog", type: "str", default: "undefined" }],
    return: "int"
  }
}
```

## Priority 3: CRM Functions (Missing)

```typescript
crm_property_definition: {
  name: "function",
  signature: {
    documentation: "Retrieves property definition for given object type.",
    arguments: [
      { name: "object_type", type: "str" },
      { name: "property_name", type: "str" }
    ],
    return: "dict"
  }
},
crm_property_definitions: {
  name: "function",
  signature: {
    documentation: "Retrieves property definitions for multiple properties.",
    arguments: [
      { name: "object_type", type: "str" },
      { name: "property_names", type: { name: "list", elementType: "str" } }
    ],
    return: { name: "list", elementType: "dict" }
  }
}
```

## Priority 4: File Functions (Missing)

```typescript
file_by_id: {
  name: "function",
  signature: {
    documentation: "Retrieves file object by ID.",
    arguments: [{ name: "id", type: "int" }],
    return: "dict"
  }
},
files_by_ids: {
  name: "function",
  signature: {
    documentation: "Retrieves multiple file objects by IDs.",
    arguments: [{ name: "ids", type: { name: "list", elementType: "int" } }],
    return: { name: "list", elementType: "dict" }
  }
}
```

## Priority 5: Utility Functions (Missing)

```typescript
color_contrast: {
  name: "function",
  signature: {
    documentation: "Validates color contrast based on WCAG standards.",
    arguments: [
      { name: "color_1", type: "str" },
      { name: "color_2", type: "str" },
      { name: "rating", type: "str", default: '"AA"' }
    ],
    return: "bool"
  }
},
cta: {
  name: "function",
  signature: {
    documentation: "Generates a particular CTA in a template, page, or email.",
    arguments: [
      { name: "cta_id", type: "str" },
      { name: "alignment", type: "str", default: "undefined" }
    ],
    return: "str"
  }
},
hubdb_table_column: {
  name: "function",
  signature: {
    documentation: "Accesses specific HubDB table column.",
    arguments: [
      { name: "table_id", type: "str" },
      { name: "column_name", type: "str" }
    ],
    return: "dict"
  }
},
hubdb_table_row: {
  name: "function",
  signature: {
    documentation: "Retrieves single HubDB table row.",
    arguments: [
      { name: "table_id", type: "str" },
      { name: "row_id", type: "int" }
    ],
    return: "dict"
  }
},
locale_name: {
  name: "function",
  signature: {
    documentation: "Returns localized name for locale.",
    arguments: [{ name: "locale_code", type: "str" }],
    return: "str"
  }
},
topic_cluster_by_content_id: {
  name: "function",
  signature: {
    documentation: "Retrieves topic cluster containing content.",
    arguments: [{ name: "content_id", type: "int" }],
    return: "dict"
  }
}
```

## Priority 6: HubL-specific Filters (Missing common ones)

Add to `HUBL_FILTERS`:

```typescript
format_currency_value: {
  name: "format_currency_value",
  signature: {
    documentation: "Formats number as currency per locale.",
    arguments: [
      { name: "locale", type: "str" },
      { name: "currency", type: "str" },
      { name: "minDecimalDigits", type: "int", default: "2" },
      { name: "maxDecimalDigits", type: "int", default: "2" }
    ],
    return: "str"
  }
},
minus_time: {
  name: "minus_time",
  signature: {
    documentation: "Subtracts time from datetime object.",
    arguments: [
      { name: "diff", type: "int" },
      { name: "timeunit", type: "str" }
    ],
    return: "datetime"
  }
},
plus_time: {
  name: "plus_time",
  signature: {
    documentation: "Adds time to datetime object.",
    arguments: [
      { name: "diff", type: "int" },
      { name: "timeunit", type: "str" }
    ],
    return: "datetime"
  }
},
strtodate: {
  name: "strtodate",
  signature: {
    documentation: "Parses string to date object.",
    arguments: [{ name: "format", type: "str" }],
    return: "datetime"
  }
},
unixtimestamp: {
  name: "unixtimestamp",
  signature: {
    documentation: "Converts datetime to Unix timestamp.",
    arguments: [],
    return: "int"
  }
}
```

## Note on Implementation

The codebase currently has two main structures:

1. **`HUBL_PROGRAM_SYMBOLS`** - For functions and global variables
2. **`HUBL_FILTERS`** - For filter functions (used with pipe syntax)

Many items appear in both Jinja2 standard library and HubL documentation. The current implementation already includes some of these, but the above lists represent the major gaps identified from official HubSpot documentation.

## Testing Recommendation

After adding these built-ins:

1. Run `npm run test-language` to ensure language package tests pass
2. Run `npm run test-e2e` to ensure E2E tests pass
3. Test completion, hover, and signature help for new items
4. Verify documentation strings are helpful and accurate
