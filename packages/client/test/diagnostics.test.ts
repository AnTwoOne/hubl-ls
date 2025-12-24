import { expect } from "expect"
import * as vscode from "vscode"
import { activate, getDocUri } from "./helper"

suite("Should provide file diagnostics", () => {
  const errorsUri = getDocUri("errors.html")
  const hublUri = getDocUri("hubl-valid.html")

  test("Returns diagnostics for errors.html", async () => {
    await activate(errorsUri)
    const diagnostics = vscode.languages.getDiagnostics(errorsUri)
    const resolvedDiagnostics = diagnostics.map((diagnostic) => ({
      severity: diagnostic.severity,
      message: diagnostic.message,
    }))

    // When the HubSpot extension is installed in the test instance, additional
    // diagnostics may be contributed by HubSpot tooling. Ensure our core
    // diagnostics are present (subset match).
    expect(resolvedDiagnostics).toEqual(
      expect.arrayContaining([
        {
          severity: 0,
          message: "Expected statement name",
        },
        { severity: 0, message: "Expected expression" },
        { severity: 0, message: "Expected expression" },
        {
          severity: 0,
          message: "Expected identifier/tuple for the loop variable",
        },
        {
          severity: 0,
          message: "Expected identifier/tuple for the loop variable",
        },
        {
          severity: 0,
          message: "Expected identifier/tuple for the loop variable",
        },
        { severity: 0, message: "Expected expression" },
        {
          severity: 0,
          message: "Expected 'in' keyword following loop variable",
        },
        { severity: 0, message: "Expected macro name" },
        { severity: 0, message: "Expected macro name" },
        { severity: 0, message: "Expected '%}'" },
        { severity: 0, message: "Expected statement" },
        { severity: 0, message: "Expected statement" },
        {
          severity: 0,
          message: "Expected identifier for the filter",
        },
        {
          severity: 0,
          message: "Expected identifier for the test",
        },
        {
          severity: 0,
          message: "Expected identifier for member expression",
        },
        {
          severity: 0,
          message: "Expected identifier for member expression",
        },
        {
          severity: 0,
          message: "Expected identifier for member expression",
        },
        {
          severity: 0,
          message: "Expected identifier for member expression",
        },
        { severity: 0, message: "Expected expression" },
        { severity: 0, message: "Expected identifier" },
        {
          severity: 1,
          message: "Couldn't find '', maybe add to Jinja LS import paths?",
        },
        {
          severity: 1,
          message:
            "Couldn't find 'somewhere/', maybe add to Jinja LS import paths?",
        },
      ]),
    )
  })

  test("Returns no diagnostics for valid HubL templates", async () => {
    await activate(hublUri)
    const diagnostics = vscode.languages.getDiagnostics(hublUri)
    expect(diagnostics).toEqual([])
  })
})
