import { expect } from "expect"
import * as vscode from "vscode"
import { activate, getDocUri } from "./helper"

suite("Should provide go to definition", () => {
  const libUri = getDocUri("lib.html")
  const importedMacroUri = getDocUri("imported-macro.html")

  test("Returns definitions for imported namespace macro calls", async () => {
    // `{{ lib.example() }}` should jump to the macro definition in lib.html
    expect(
      await getDefinition(importedMacroUri, new vscode.Position(2, 9)),
    ).toEqual({
      uri: libUri.toString(),
      range: { start: 9, end: 16 },
    })
  })

  test("Returns definitions for module fields in module.html", async () => {
    const moduleUri = getDocUri("test-module.module/module.html")
    const fieldsJsonUri = getDocUri("test-module.module/fields.json")

    // Line 2 (0-idx: 1): `  <h1>{{ module.heading }}</h1>`
    // Position 16 is on "heading" in module.heading
    expect(
      await getDefinition(moduleUri, new vscode.Position(1, 16)),
    ).toEqual({
      uri: fieldsJsonUri.toString(),
      range: { start: 18, end: 27 }, // Position of "heading" in fields.json
    })
  })

  test("Returns definitions for nested module fields", async () => {
    const moduleUri = getDocUri("test-module.module/module.html")
    const fieldsJsonUri = getDocUri("test-module.module/fields.json")

    // Line 18 (0-idx: 17): `    {% if module.settings.enable_animations %}`
    // Position 18 is on "settings" (position 17 lands on the dot boundary)
    expect(
      await getDefinition(moduleUri, new vscode.Position(17, 18)),
    ).toEqual({
      uri: fieldsJsonUri.toString(),
      range: { start: 1141, end: 1151 }, // Position of "settings" in fields.json
    })
  })

  test("Returns definitions for loop variable itself", async () => {
    const moduleUri = getDocUri("test-module.module/module.html")

    // Line 13 (0-idx: 12): `        <h3>{{ item.title }}</h3>`
    // Position 15 is on "item" - clicking on the loop variable should go to its definition
    // Expected: go to line 11 where `item` is defined in `{% for item in module.items %}`
    const result = await getDefinitionOrNull(moduleUri, new vscode.Position(12, 15))
    expect(result).not.toBeNull()
    // The definition should be in the same file
    expect(result?.uri).toEqual(moduleUri.toString())
  })

  test("Returns definitions for loop variable properties from repeater fields", async () => {
    const moduleUri = getDocUri("test-module.module/module.html")
    const fieldsJsonUri = getDocUri("test-module.module/fields.json")

    // Line 13 (0-idx: 12): `        <h3>{{ item.title }}</h3>`
    // `item` is a loop variable from `{% for item in module.items %}`
    // Position 21 is inside "title" in item.title (not at the boundary with the dot)
    expect(
      await getDefinition(moduleUri, new vscode.Position(12, 21)),
    ).toEqual({
      uri: fieldsJsonUri.toString(),
      range: { start: 931, end: 938 }, // Position of "title" in items.children
    })
  })
})

export const getDefinition = async (
  uri: vscode.Uri,
  position: vscode.Position,
) => {
  await activate(uri)
  const locations: (vscode.Location | vscode.LocationLink)[] =
    await vscode.commands.executeCommand(
      "vscode.executeDefinitionProvider",
      uri,
      position,
    )
  expect(locations.length).toEqual(1)
  const location = locations[0]
  if (location instanceof vscode.Location) {
    const document = await vscode.workspace.openTextDocument(location.uri)
    return {
      uri: location.uri.toString(),
      range: {
        start: document.offsetAt(location.range.start),
        end: document.offsetAt(location.range.end),
      },
    }
  } else {
    const document = await vscode.workspace.openTextDocument(location.targetUri)
    return {
      uri: location.targetUri.toString(),
      range: {
        start: document.offsetAt(location.targetRange.start),
        end: document.offsetAt(location.targetRange.end),
      },
    }
  }
}

export const getDefinitionOrNull = async (
  uri: vscode.Uri,
  position: vscode.Position,
) => {
  await activate(uri)
  const locations: (vscode.Location | vscode.LocationLink)[] =
    await vscode.commands.executeCommand(
      "vscode.executeDefinitionProvider",
      uri,
      position,
    )
  if (locations.length === 0) {
    return null
  }
  const location = locations[0]
  if (location instanceof vscode.Location) {
    const document = await vscode.workspace.openTextDocument(location.uri)
    return {
      uri: location.uri.toString(),
      range: {
        start: document.offsetAt(location.range.start),
        end: document.offsetAt(location.range.end),
      },
    }
  } else {
    const document = await vscode.workspace.openTextDocument(location.targetUri)
    return {
      uri: location.targetUri.toString(),
      range: {
        start: document.offsetAt(location.targetRange.start),
        end: document.offsetAt(location.targetRange.end),
      },
    }
  }
}
