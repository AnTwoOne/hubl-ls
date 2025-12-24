import { expect } from "expect"
import * as vscode from "vscode"
import { activate, getDocUri } from "./helper"

suite("Should provide completions", () => {
  const errorsUri = getDocUri("errors.jinja")
  const hublUri = getDocUri("hubl-completions.jinja")

  test("Returns completions for errors.jinja", async () => {
    expect(
      await getCompletions(errorsUri, new vscode.Position(17, 6), "u"),
    ).toMatchObject([
      {
        label: "unique",
        kind: "Function",
      },
      {
        label: "upper",
        kind: "Function",
      },
      {
        label: "urlencode",
        kind: "Function",
      },
      {
        label: "urlize",
        kind: "Function",
      },
    ])

    expect(
      await getCompletions(errorsUri, new vscode.Position(20, 8), "u"),
    ).toMatchObject([
      {
        label: "unique",
        kind: "Function",
      },
      {
        label: "upper",
        kind: "Function",
      },
      {
        label: "urlencode",
        kind: "Function",
      },
      {
        label: "urlize",
        kind: "Function",
      },
    ])

    expect(
      await getCompletions(errorsUri, new vscode.Position(21, 9), "o"),
    ).toMatchObject([
      {
        label: "odd",
        kind: "Function",
      },
    ])

    expect(
      await getCompletions(errorsUri, new vscode.Position(18, 7), "o"),
    ).toMatchObject([
      {
        label: "odd",
        kind: "Function",
      },
    ])

    expect(
      await getCompletions(errorsUri, new vscode.Position(23, 11)),
    ).toMatchObject([
      {
        label: "arguments",
        kind: "Property",
      },
      {
        label: "caller",
        kind: "Property",
      },
      {
        label: "catch_kwargs",
        kind: "Property",
      },
      {
        label: "catch_varargs",
        kind: "Property",
      },
      {
        label: "name",
        kind: "Property",
      },
    ])

    expect(
      await getCompletions(errorsUri, new vscode.Position(32, 9)),
    ).toMatchObject([{ label: "head", kind: "Function" }])

    expect(
      await getCompletions(errorsUri, new vscode.Position(34, 12)),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "errors.jinja", kind: "File" }),
        expect.objectContaining({ label: "free", kind: "Folder" }),
        expect.objectContaining({ label: "hola.jinja2", kind: "File" }),
        expect.objectContaining({ label: "lib.jinja", kind: "File" }),
        expect.objectContaining({ label: "somewhere", kind: "Folder" }),
      ]),
    )

    expect(
      await getCompletions(errorsUri, new vscode.Position(35, 22)),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "hi.j2", kind: "File" }),
      ]),
    )
  })

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
