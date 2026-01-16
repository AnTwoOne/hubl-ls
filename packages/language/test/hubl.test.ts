import { describe, expect, it } from "vitest"

import { ast, parse, tokenize } from "../src"

describe("HubL compatibility (language package)", () => {
  it("parses unknown HubL-style tags as TagStatement without diagnostics", () => {
    const text = [
      "{% module path='@hubspot/rich_text' label='Body' no_wrapper=true %}",
      "{% require_css 'https://example.com/app.css' %}",
      "{% require_js 'https://example.com/app.js' %}",
      "{% dnd_area 'main' label='Main' %}",
    ].join("\n")

    const [tokens] = tokenize(text, {}, true)
    const [program, , errors] = parse(tokens, true)

    // HubL tags should not create MissingNode/UnexpectedToken diagnostics.
    expect(errors).toHaveLength(0)

    const tagStatements = program.body.filter(
      (s) => s instanceof ast.TagStatement,
    ) as ast.TagStatement[]

    expect(tagStatements.map((t) => t.tagName)).toEqual([
      "module",
      "require_css",
      "require_js",
      "dnd_area",
    ])

    // Ensure we parse HubL-style keyword args outside parentheses.
    const moduleTag = tagStatements[0]
    const kwargNames = moduleTag.args
      .filter((a) => a instanceof ast.KeywordArgumentExpression)
      .map((a) => (a as ast.KeywordArgumentExpression).key.value)
      .sort()
    expect(kwargNames).toEqual(["label", "no_wrapper", "path"])
  })

  it("still throws for stray HubL/Jinja control-structure closers", () => {
    const text = "{% endfor %}"
    const tokens = tokenize(text)
    expect(() => parse(tokens)).toThrowError()
  })

  it("accepts dict/object literals inside `{% set ... %}` with whitespace-trim closers (`-%}`)", () => {
    const text = [
      "{%- set accepts = {",
      "  'a': 'a',",
      "  'b': 'b',",
      "} -%}",
    ].join("\n")

    const [tokens, lexerErrors] = tokenize(text, {}, true)
    const [program, , parserErrors] = parse(tokens, true)

    expect(lexerErrors).toHaveLength(0)
    expect(parserErrors).toHaveLength(0)

    // Sanity: top-level should contain a Set statement.
    expect(program.body.some((n) => n.type === "Set")).toBe(true)
  })

  it("accepts embedded `{{ ... }}` inside HubL tag attribute values and JS-style `||`", () => {
    const text = [
      "{%- video_player ",
      "  player_id={{ data.player_id }},",
      "  type={{ data.player_type || 'scriptV4' }}",
      "-%}",
    ].join("\n")

    const [tokens, lexerErrors] = tokenize(text, {}, true)
    const [program, , parserErrors] = parse(tokens, true)

    expect(lexerErrors).toHaveLength(0)
    expect(parserErrors).toHaveLength(0)
    expect(program.body.some((n) => n.type === "TagStatement")).toBe(true)
  })
})
