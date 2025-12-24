import { expect } from "expect"
import * as vscode from "vscode"
import { activate, getDocUri, rangeToJson } from "./helper"

suite("Should provide hover", () => {
  const errorsUri = getDocUri("errors.jinja")
  const moreUri = getDocUri("free/more.jinja")
  const hublUri = getDocUri("hubl-valid.jinja")
  const macroDocsUri = getDocUri("macro-docs.jinja")

  test("Returns hover information for errors.jinja", async () => {
    expect(
      await getHover(errorsUri, new vscode.Position(27, 15)),
    ).toMatchObject({
      contents: ["```python\n(start: int, stop: int, step: int) -> range\n```"],
      range: [
        { character: 12, line: 27 },
        { character: 17, line: 27 },
      ],
    })

    expect(await getHover(errorsUri, new vscode.Position(23, 6))).toMatchObject(
      {
        contents: [
          '```python\n(variable1 = "something", another = true, xyzw = 1574) -> str\n```',
        ],
        range: [
          { character: 3, line: 23 },
          { character: 10, line: 23 },
        ],
      },
    )

    expect(await getHover(moreUri, new vscode.Position(41, 8))).toEqual({
      contents: ["```python\nx: int = 16\n```", "magical"],
      range: [
        { line: 41, character: 8 },
        { line: 41, character: 8 },
      ],
    })
  })

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
    const hover = await getHover(macroDocsUri, new vscode.Position(11, 5))

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
  expect(hovers.length).toEqual(1)
  const hover = hovers[0]
  return {
    contents: hoverToContents(hover),
    range: rangeToJson(hover.range),
  }
}
