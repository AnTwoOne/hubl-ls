import * as path from "path"

import { runTests } from "@vscode/test-electron"

async function main() {
  try {
    // When ELECTRON_RUN_AS_NODE is set, Electron behaves like Node and will try to
    // `require()` the first positional arg (our workspace folder), causing tests to fail.
    // Ensure we always run VS Code as Electron.
    delete process.env.ELECTRON_RUN_AS_NODE

    const extensionDevelopmentPath = path.resolve(__dirname, "..", "..")

    const extensionTestsPath = __dirname

    const workspacePath = path.resolve(
      __dirname,
      "..",
      "..",
      "packages",
      "client",
      "fixture",
    )

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath],
    })
  } catch {
    console.error("Failed to run tests")
    process.exit(1)
  }
}

main()
