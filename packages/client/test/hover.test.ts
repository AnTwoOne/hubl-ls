import { expect } from "expect"
import * as vscode from "vscode"
import { activate, getDocUri, rangeToJson } from "./helper"

suite("Should provide hover", () => {
  const hublUri = getDocUri("hubl-valid.html")
  const macroDocsUri = getDocUri("macro-docs.html")
  const typedefUri = getDocUri("typedef-test.html")

  test("Returns hover information for HubL tags + functions", async () => {
    // Hover tag name: `{% module ... %}`
    const moduleHover = await getHover(hublUri, new vscode.Position(0, 5))
    expect(moduleHover.content).toContain(
      "module(path: str, label: str, no_wrapper: bool) -> None",
    )

    // Hover function: `resize_image_url(...)`
    const resizeHover = await getHover(hublUri, new vscode.Position(4, 6))
    expect(resizeHover.content).toContain(
      "(src: str, width: int, height: int) -> str",
    )
  })

  test("Formats JSDoc-like macro documentation", async () => {
    // Hover macro call: `SectionWrapper(...)`
    const hover = await getHover(macroDocsUri, new vscode.Position(12, 5))

    // Content should include signature and documentation
    expect(hover.content).toContain("SectionWrapper")
    expect(hover.content).toContain("**Parameters**")
    expect(hover.content).toContain("**Properties**")
    expect(hover.content).toContain("`data.section_id`")
  })

  test("Shows @example in hover documentation", async () => {
    // Hover macro `Avatar` which has @example
    const hover = await getHover(typedefUri, new vscode.Position(13, 12))

    expect(hover.content).toContain("**Example**")
    expect(hover.content).toContain("Avatar")
  })

  test("Shows @deprecated warning in hover", async () => {
    // Hover macro call `OldMacro` which has @deprecated
    const hover = await getHover(typedefUri, new vscode.Position(26, 5))

    // The deprecation warning is included in the documentation string
    expect(hover.content.toLowerCase()).toContain("deprecated")
    expect(hover.content).toContain("NewMacro")
  })

  test("Shows hover for loop variable properties in module templates", async () => {
    const moduleUri = getDocUri("test-module.module/module.html")

    // Line 13 (0-idx: 12): `        <h3>{{ item.title }}</h3>`
    // Position 21 is inside "title" in item.title (not at the boundary with the dot)
    const hover = await getHover(moduleUri, new vscode.Position(12, 21))

    // Should show the field documentation from fields.json
    expect(hover.content).toContain("title")
    expect(hover.content).toContain("text")
  })
})

const hoverToContent = (h: vscode.Hover): string => {
  // Handle both array of MarkedString and single MarkupContent
  if (Array.isArray(h.contents)) {
    return h.contents
      .map((c) => {
        if (typeof c === "string") {
          return c.trim()
        }
        return c.value.trim()
      })
      .join("\n\n")
  }
  // Single MarkupContent
  if (typeof h.contents === "string") {
    return h.contents.trim()
  }
  return h.contents.value.trim()
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
    content: hoverToContent(hover),
    range: rangeToJson(hover.range),
  }
}
