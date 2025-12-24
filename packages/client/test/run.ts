import * as path from "path"
import { spawnSync } from "node:child_process"

import {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
  runTests,
} from "@vscode/test-electron"

const HUBSPOT_HUBL_EXTENSION_ID = "hubspot.hubl"

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

    // Ensure the HubSpot HubL extension is installed in the VSCode test instance.
    // This provides the HubL language ids (e.g. `html-hubl`) so we can run tests
    // in a real HubSpot CMS context.
    const vscodeExecutablePath = await downloadAndUnzipVSCode("1.107.1")
    const [cliPath, ...cliArgs] =
      resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath)

    const testRoot = path.resolve(extensionDevelopmentPath, ".vscode-test")
    const userDataDir = path.resolve(testRoot, "user-data")
    const extensionsDir = path.resolve(testRoot, "extensions")

    const install = spawnSync(
      cliPath,
      [
        ...cliArgs,
        "--user-data-dir",
        userDataDir,
        "--extensions-dir",
        extensionsDir,
        "--install-extension",
        HUBSPOT_HUBL_EXTENSION_ID,
        "--force",
      ],
      { stdio: "inherit" },
    )
    if (install.status !== 0) {
      throw new Error(
        `Failed to install ${HUBSPOT_HUBL_EXTENSION_ID} (exit=${install.status})`,
      )
    }

    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        "--user-data-dir",
        userDataDir,
        "--extensions-dir",
        extensionsDir,
        workspacePath,
      ],
    })
  } catch {
    console.error("Failed to run tests")
    process.exit(1)
  }
}

main()
