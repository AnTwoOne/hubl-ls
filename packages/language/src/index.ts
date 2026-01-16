/**
 * @file HubL templating engine
 *
 * A minimalistic JavaScript reimplementation of the HubL/Jinja templating engine.
 * HubL is based on [Jinja](https://github.com/pallets/jinja) syntax with HubSpot-specific extensions.
 * Special thanks to [Tyler Laceby](https://github.com/tlaceby) for his amazing
 * ["Guide to Interpreters"](https://github.com/tlaceby/guide-to-interpreters-series) tutorial series,
 * which provided the basis for this implementation.
 *
 * @module index
 */
import type { Program } from "./ast"
import * as ast from "./ast"
import { format, formatExpression } from "./format"
import { LexerError, tokenize } from "./lexer"
import { parse } from "./parser"
import type { StringValue } from "./runtime"
import { Environment, Interpreter, setupGlobals } from "./runtime"

export class Template {
  parsed: Program

  /**
   * @param {string} template The template string
   */
  constructor(template: string) {
    const tokens = tokenize(template, {
      lstrip_blocks: true,
      trim_blocks: true,
    })
    this.parsed = parse(tokens, false)
  }

  render(items?: Record<string, unknown>): string {
    // Create a new environment for this template
    const env = new Environment()
    setupGlobals(env)

    // Add user-defined variables
    if (items) {
      for (const [key, value] of Object.entries(items)) {
        env.set(key, value)
      }
    }

    const interpreter = new Interpreter(env)

    const result = interpreter.run(this.parsed) as StringValue
    return result.value
  }

  format(options?: { indent: string | number }): string {
    return format(this.parsed, options?.indent || "\t")
  }
}

export {
  ast,
  Environment,
  formatExpression,
  Interpreter,
  LexerError,
  parse,
  tokenize,
}
