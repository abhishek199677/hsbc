/**
 * Python runner using child_process.
 *
 * Writes user code + input to a temp file, runs it with python3,
 * and captures stdout/stderr. Uses a hard timeout to kill long-running processes.
 */

import { execFile } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

export interface RunResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  error?: string;
}

/**
 * Execute Python code with the given input.
 */
export async function runPython(
  code: string,
  input: string,
  timeoutMs: number = 10000
): Promise<RunResult> {
  const startTime = Date.now();
  const tmpFile = join(tmpdir(), `sandbox_py_${randomUUID()}.py`);

  try {
    // Wrap code to auto-invoke with input
    const wrappedCode = `
import sys
import json

${code}

# Auto-detect and call the function
_input = ${JSON.stringify(input)}
_lines = _input.strip().split('\\n')

# Find all functions defined in the module
import inspect
_module_funcs = [name for name, obj in inspect.getmembers(sys.modules[__name__]) if inspect.isfunction(obj) and name != 'run']

for _func_name in _module_funcs:
    _func = eval(_func_name)
    try:
        if len(_lines) == 1:
            try:
                _parsed = json.loads(_lines[0])
            except:
                _parsed = _lines[0]
            _result = _func(_parsed)
        else:
            _args = []
            for _line in _lines:
                try:
                    _args.append(json.loads(_line))
                except:
                    _args.append(_line)
            _result = _func(*_args)

        if _result is not None:
            if isinstance(_result, (list, dict)):
                print(json.dumps(_result))
            else:
                print(_result)
            break
    except Exception as e:
        continue
`;

    await writeFile(tmpFile, wrappedCode, "utf-8");

    const output = await new Promise<{ stdout: string; stderr: string }>(
      (resolve, reject) => {
        execFile(
          "python3",
          [tmpFile],
          {
            timeout: timeoutMs,
            maxBuffer: 1024 * 1024,
          },
          (error, stdout, stderr) => {
            if (error && error.killed) {
              resolve({ stdout: "", stderr: "Time Limit Exceeded" });
            } else if (error) {
              resolve({
                stdout: stdout || "",
                stderr: stderr || error.message,
              });
            } else {
              resolve({ stdout: stdout || "", stderr: stderr || "" });
            }
          }
        );
      }
    );

    return {
      stdout: output.stdout.trim(),
      stderr: output.stderr.trim(),
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
  } finally {
    try {
      await unlink(tmpFile);
    } catch {}
  }
}
