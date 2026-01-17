import { expect } from "expect"
import * as vscode from "vscode"
import { activate, getDocUri, rangeToJson } from "./helper"

suite("Should provide hover", () => {
  const hublUri = getDocUri("hubl-valid.html")
  const macroDocsUri = getDocUri("macro-docs.html")
  const typedefUri = getDocUri("typedef-test.html")

  test("Returns hover information for HubL tags + functions", async () => {
    // Hover tag name: `{% module ... %}`
    expect(await getHover(hublUri, new vscode.Position(0, 5))).toMatchObject({
      contents: expect.arrayContaining([
        "```python\nmodule(path: str, label: str, no_wrapper: bool) -> None\n```",
      ]),
    })

    // Hover function: `resize_image_url(...)`
    expect(await getHover(hublUri, new vscode.Position(4, 6))).toMatchObject({
      contents: expect.arrayContaining([
        "```python\n(src: str, width: int, height: int) -> str\n```",
      ]),
    })
  })

  test("Formats JSDoc-like macro documentation", async () => {
    // Hover macro call: `SectionWrapper(...)`
    const hover = await getHover(macroDocsUri, new vscode.Position(12, 5))

    // Signature should still be shown.
    expect(hover.contents).toEqual(
      expect.arrayContaining([
        expect.stringContaining("SectionWrapper"),
        expect.stringContaining("**Parameters**"),
        expect.stringContaining("**Properties**"),
        expect.stringContaining("`data.section_id`"),
      ]),
    )
  })

  test("Shows @example in hover documentation", async () => {
    // Hover macro `Avatar` which has @example
    const hover = await getHover(typedefUri, new vscode.Position(13, 12))

    expect(hover.contents).toEqual(
      expect.arrayContaining([
        expect.stringContaining("**Example**"),
        expect.stringContaining("Avatar"),
      ]),
    )
  })

  test("Shows @deprecated warning in hover", async () => {
    // Hover macro call `OldMacro` which has @deprecated
    const hover = await getHover(typedefUri, new vscode.Position(26, 5))

    // The deprecation warning is included in the documentation string
    const hasDeprecated = hover.contents.some((c) =>
      c.toLowerCase().includes("deprecated"),
    )
    const hasNewMacro = hover.contents.some((c) => c.includes("NewMacro"))
    expect(hasDeprecated).toBe(true)
    expect(hasNewMacro).toBe(true)
  })
})

const hoverToContents = (h: vscode.Hover) => {
  return h.contents.map((c) => {
    if (typeof c === "string") {
      return c.trim()
    }
    return c.value.trim()
  })
}

export const getHover = async (uri: vscode.Uri, position: vscode.Position) => {
  await activate(uri)
  const hovers: vscode.Hover[] = await vscode.commands.executeCommand(
    "vscode.executeHoverProvider",
    uri,
    position,
  )
  expect(hovers.length).toBeGreaterThan(0)
  const hover = hovers[0]
  return {
    contents: hoverToContents(hover),
    range: rangeToJson(hover.range),
  }
}
