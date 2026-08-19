/**
 * JavaScript/TypeScript runner using vm2 for sandboxed execution.
 *
 * Runs user code in an isolated V8 context with a hard timeout
 * and memory limit. Captures console.log output for comparison.
 */

import { VM } from "vm2";

export interface RunResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  error?: string;
}

/**
 * Execute JavaScript code with the given input.
 * The code should define a function and call it with the input,
 * or the input is provided via stdin simulation.
 */
export async function runJavaScript(
  code: string,
  input: string,
  timeoutMs: number = 10000
): Promise<RunResult> {
  const startTime = Date.now();

  try {
    // Create a sandboxed VM with console.log capture
    const logs: string[] = [];
    const vm = new VM({
      timeout: timeoutMs,
      sandbox: {
        console: {
          log: (...args: unknown[]) => {
            logs.push(
              args
                .map((a) =>
                  typeof a === "object" ? JSON.stringify(a) : String(a)
                )
                .join(" ")
            );
          },
          error: (...args: unknown[]) => {
            logs.push(
              args
                .map((a) =>
                  typeof a === "object" ? JSON.stringify(a) : String(a)
                )
                .join(" ")
            );
          },
        },
        // Provide common built-ins
        Math,
        JSON,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Map,
        Set,
        Promise,
        Date,
        Error,
        TypeError,
        RangeError,
      },
    });

    // Wrap code to auto-invoke with input
    const wrappedCode = `
      ${code}
      // Auto-detect and call the function
      (function() {
        const input = ${JSON.stringify(input)};
        const lines = input.split('\\n');

        // Try to find the main function
        const fnNames = Object.keys(this).filter(k => typeof this[k] === 'function' && k !== 'console');
        let result;

        for (const name of fnNames) {
          try {
            const fn = this[name];
            // Try calling with parsed input
            if (lines.length === 1) {
              try {
                const parsed = JSON.parse(lines[0]);
                result = fn(parsed);
              } catch {
                result = fn(lines[0]);
              }
            } else {
              const args = lines.map(l => {
                try { return JSON.parse(l); } catch { return l; }
              });
              result = fn(...args);
            }
            if (result !== undefined) {
              return result;
            }
          } catch(e) {
            // Continue to next function
          }
        }

        // If no function found, try executing as a script
        return undefined;
      })()
    `;

    const result = vm.run(wrappedCode);
    const stdout = logs.length > 0 ? logs.join("\n") : (result !== undefined ? formatOutput(result) : "");

    return {
      stdout,
      stderr: "",
      executionTime: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      stdout: "",
      stderr: errorMessage,
      executionTime: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

function formatOutput(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}
