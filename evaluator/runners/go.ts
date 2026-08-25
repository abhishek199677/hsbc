/**
 * Go runner using child_process.
 *
 * Writes user code to a temp main.go file, runs with `go run`,
 * and captures output. Uses a hard timeout.
 */

import { exec } from "child_process";
import { writeFile, unlink, mkdir } from "fs/promises";
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
 * Execute Go code with the given input.
 */
export async function runGo(
  code: string,
  input: string,
  timeoutMs: number = 10000
): Promise<RunResult> {
  const startTime = Date.now();
  const jobId = randomUUID();
  const tmpDir = join(tmpdir(), `sandbox_go_${jobId}`);
  const goFile = join(tmpDir, "main.go");

  try {
    await mkdir(tmpDir, { recursive: true });

    // If code doesn't have main, wrap it
    let fullCode = code;
    if (!code.includes("func main()")) {
      fullCode = `
package main

import (
\t"fmt"
\t"strings"
\t"strconv"
)

${code}

func main() {
\tinput := "${input.replace(/"/g, '\\"')}"
\t// Remove brackets
\tinput = strings.Trim(input, "[]")
\tparts := strings.Split(input, ",")
\tnums := make([]int, len(parts))
\tfor i, p := range parts {
\t\tp = strings.TrimSpace(p)
\t\tnums[i], _ = strconv.Atoi(p)
\t}

\tresult := twoSum(nums, 9)
\tfmt.Println(result)
}`;
    }

    await writeFile(goFile, fullCode, "utf-8");

    // Run
    const runResult = await new Promise<{ stdout: string; stderr: string; killed: boolean }>(
      (resolve) => {
        exec(
          `cd "${tmpDir}" && go run main.go`,
          { cwd: tmpDir, timeout: timeoutMs, maxBuffer: 1024 * 1024 },
          (error, stdout, stderr) => {
            const killed = typeof error === "object" && error !== null && "killed" in error && error.killed === true;
            resolve({
              stdout: stdout || "",
              stderr: stderr || "",
              killed,
            });
          }
        );
      }
    );

    if (runResult.killed) {
      return {
        stdout: "",
        stderr: "Time Limit Exceeded",
        executionTime: Date.now() - startTime,
        error: "Time Limit Exceeded",
      };
    }

    if (runResult.stderr && !runResult.stdout) {
      return {
        stdout: "",
        stderr: runResult.stderr,
        executionTime: Date.now() - startTime,
        error: runResult.stderr,
      };
    }

    return {
      stdout: runResult.stdout.trim(),
      stderr: runResult.stderr.trim(),
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
      await unlink(goFile).catch(() => {});
      const { rmdirSync } = await import("fs");
      rmdirSync(tmpDir);
    } catch {}
  }
}
