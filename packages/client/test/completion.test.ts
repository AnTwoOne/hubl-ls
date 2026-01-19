import { expect } from "expect"
import * as vscode from "vscode"
import { activate, getDocUri } from "./helper"

suite("Should provide completions", () => {
  const hublUri = getDocUri("hubl-completions.html")
  const macroDocsUri = getDocUri("macro-docs.html")
  const typedefUri = getDocUri("typedef-test.html")

  test("Returns HubL completions (tags, globals, filters)", async () => {
    // Tag-name completion while editing an unknown TagStatement name.
    // `{% modu %}` should suggest `{% module %}`.
    expect(
      await getCompletions(hublUri, new vscode.Position(0, 5), "mo"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "module", kind: "Keyword" }),
      ]),
    )

    // Prefix completion for dnd_* tags.
    expect(
      await getCompletions(hublUri, new vscode.Position(1, 6), "dnd"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "dnd_area", kind: "Keyword" }),
        expect.objectContaining({ label: "dnd_section", kind: "Keyword" }),
        expect.objectContaining({ label: "dnd_column", kind: "Keyword" }),
      ]),
    )

    // Global completion: `content` should be available.
    expect(
      await getCompletions(hublUri, new vscode.Position(3, 5), "con"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "content", kind: "Variable" }),
      ]),
    )

    // Member completion: `content.id` is a known property.
    expect(await getCompletions(hublUri, new vscode.Position(4, 11))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "id", kind: "Property" }),
      ]),
    )

    // Filter completion: `escapejs` should be suggested.
    expect(
      await getCompletions(hublUri, new vscode.Position(5, 9), "esc"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "escapejs", kind: "Function" }),
      ]),
    )
  })

  test("Completes macro param properties from JSDoc-like @property docs", async () => {
    // In macro-docs.html, the macro `SectionWrapper(data)` documents properties via:
    //   @property {string} data.section_id
    //   @property {object} data.section_styles
    const completions = await getCompletions(
      macroDocsUri,
      // Line contains `  {{ data. }}`.
      new vscode.Position(9, 10),
    )

    expect(completions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "section_id", kind: "Property" }),
        expect.objectContaining({ label: "section_styles", kind: "Property" }),
      ]),
    )
  })

  test("Resolves @typedef type reference for nested property completion", async () => {
    // In typedef-test.html, Testimonial has:
    //   @property {AvatarData} data.author
    // where AvatarData is defined via @typedef with `name` and `role` properties.
    // Inside the macro, `data.author.` should complete with `name` and `role`.
    const completions = await getCompletions(
      typedefUri,
      // Line 36 (0-indexed: 35) contains `  {{ data.author.name }}`
      // Position 18 is right after the dot in `data.author.`
      new vscode.Position(35, 18),
    )

    expect(completions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "name", kind: "Property" }),
        expect.objectContaining({ label: "role", kind: "Property" }),
      ]),
    )
  })

  test("Completes module fields from fields.json in module.html", async () => {
    // In test-module.module/module.html, the fields.json defines fields like:
    // heading, show_image, hero_image, background_color, layout, items, settings
    // Line 2 (0-indexed: 1) contains `<h1>{{ module.heading }}</h1>`
    // Position 14 is right after the dot in `module.`
    const moduleUri = getDocUri("test-module.module/module.html")
    const completions = await getCompletions(
      moduleUri,
      new vscode.Position(1, 14),
    )

    // Should include the fields defined in fields.json
    expect(completions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "heading", kind: "Property" }),
        expect.objectContaining({ label: "show_image", kind: "Property" }),
        expect.objectContaining({ label: "hero_image", kind: "Property" }),
        expect.objectContaining({ label: "background_color", kind: "Property" }),
        expect.objectContaining({ label: "layout", kind: "Property" }),
        expect.objectContaining({ label: "items", kind: "Property" }),
        expect.objectContaining({ label: "settings", kind: "Property" }),
      ]),
    )
  })
})

export const getCompletions = async (
  uri: vscode.Uri,
  position: vscode.Position,
  startingWith: string = "",
) => {
  await activate(uri)
  const completions: vscode.CompletionList =
    await vscode.commands.executeCommand(
      "vscode.executeCompletionItemProvider",
      uri,
      position,
    )
  return completions.items
    .map((item) => JSON.parse(JSON.stringify(item)))
    .filter((item) =>
      (item.label?.label ?? item.label).startsWith(startingWith),
    )
}
