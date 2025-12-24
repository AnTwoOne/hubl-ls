import { expect } from "expect"
import * as vscode from "vscode"
import { activate, getDocUri } from "./helper"

suite("Should provide file details", () => {
  const libUri = getDocUri("lib.html")
  const errorsUri = getDocUri("errors.html")

  test("Highlights lib.html", async () => {
    const resolvedTokens = await getTokens(libUri)
    expect(resolvedTokens).toEqual([
      { start: 3, end: 8, tokenType: "keyword" },
      { start: 9, end: 16, tokenType: "function" },
      {
        start: 17,
        end: 26,
        tokenType: "variable",
      },
      {
        start: 27,
        end: 38,
        tokenType: "string",
      },
      {
        start: 40,
        end: 47,
        tokenType: "variable",
      },
      {
        start: 48,
        end: 52,
        tokenType: "macro",
      },
      {
        start: 54,
        end: 58,
        tokenType: "variable",
      },
      {
        start: 59,
        end: 63,
        tokenType: "number",
      },
      {
        start: 71,
        end: 79,
        tokenType: "keyword",
      },
      {
        start: 86,
        end: 91,
        tokenType: "keyword",
      },
      {
        start: 103,
        end: 111,
        tokenType: "keyword",
      },
    ])
  })

  test("Highlights the end of errors.html", async () => {
    const resolvedTokens = await getTokens(errorsUri)

    const document = await vscode.workspace.openTextDocument(errorsUri)
    const text = document.getText()
    const anchor = text.indexOf("for x in range(2)")
    expect(anchor).toBeGreaterThan(0)

    const forStart = text.indexOf("for", anchor)
    const xStart = text.indexOf("x", anchor)
    const inStart = text.indexOf("in", anchor)
    const rangeStart = text.indexOf("range", anchor)
    const twoStart = text.indexOf("2", rangeStart)

    expect(resolvedTokens).toEqual(
      expect.arrayContaining([
        { start: forStart, end: forStart + 3, tokenType: "keyword" },
        { start: xStart, end: xStart + 1, tokenType: "variable" },
        { start: inStart, end: inStart + 2, tokenType: "keyword" },
        { start: rangeStart, end: rangeStart + 5, tokenType: "function" },
        { start: twoStart, end: twoStart + 1, tokenType: "number" },
      ]),
    )
  })
})

const getTokens = async (docUri: vscode.Uri) => {
  await activate(docUri)
  const document = await vscode.workspace.openTextDocument(docUri)
  const legend: vscode.SemanticTokensLegend =
    await vscode.commands.executeCommand(
      "vscode.provideDocumentSemanticTokensLegend",
      docUri,
    )
  const tokens: vscode.SemanticTokens = await vscode.commands.executeCommand(
    "vscode.provideDocumentSemanticTokens",
    docUri,
  )
  const resolvedTokens = []
  let previousLine = 0
  let previousCharacter = 0
  for (let i = 0; i < tokens.data.length; i += 5) {
    const lineDelta = tokens.data[i]
    const characterDelta = tokens.data[i + 1]
    const currentLine = previousLine + lineDelta
    const currentCharacter =
      currentLine === previousLine
        ? previousCharacter + characterDelta
        : characterDelta
    const start = document.offsetAt(
      new vscode.Position(currentLine, currentCharacter),
    )
    previousLine = currentLine
    previousCharacter = currentCharacter
    resolvedTokens.push({
      start,
      end: start + tokens.data[i + 2],
      tokenType: legend.tokenTypes[tokens.data[i + 3]],
    })
  }
  return resolvedTokens
}
