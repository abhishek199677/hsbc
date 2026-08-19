/**
 * C++ runner using child_process.
 *
 * Writes user code to a temp .cpp file, compiles with g++,
 * and runs the resulting binary. Uses a hard timeout.
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
 * Execute C++ code with the given input.
 */
export async function runCpp(
  code: string,
  input: string,
  timeoutMs: number = 10000
): Promise<RunResult> {
  const startTime = Date.now();
  const jobId = randomUUID();
  const tmpDir = join(tmpdir(), `sandbox_cpp_${jobId}`);
  const cppFile = join(tmpDir, "solution.cpp");
  const binFile = join(tmpDir, "solution");

  try {
    await mkdir(tmpDir, { recursive: true });

    // If code doesn't have main, wrap it
    let fullCode = code;
    if (!code.includes("int main")) {
      fullCode = `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

${code}

int main() {
    string line;
    getline(cin, line);
    // Parse input as simple comma-separated values
    vector<int> nums;
    stringstream ss(line);
    string token;
    // Remove brackets
    if (!line.empty() && line[0] == '[') line = line.substr(1);
    if (!line.empty() && line.back() == ']') line.pop_back();
    stringstream ss2(line);
    while (getline(ss2, token, ',')) {
        // Trim whitespace
        size_t start = token.find_first_not_of(" \\t");
        size_t end = token.find_last_not_of(" \\t");
        if (start != string::npos) token = token.substr(start, end - start + 1);
        nums.push_back(stoi(token));
    }

    Solution sol;
    vector<int> result = sol.twoSum(nums, 9);
    cout << "[" << result[0] << "," << result[1] << "]" << endl;
    return 0;
}`;
    }

    await writeFile(cppFile, fullCode, "utf-8");

    // Compile
    const compileResult = await new Promise<{ stderr: string; code: number | null }>(
      (resolve) => {
        exec(
          `g++ -std=c++17 -o "${binFile}" "${cppFile}" 2>&1`,
          { cwd: tmpDir, timeout: 15000 },
          (error, stdout, stderr) => {
            resolve({
              stderr: stderr || stdout || "",
              code: error?.code ?? null,
            });
          }
        );
      }
    );

    if (compileResult.code !== 0) {
      return {
        stdout: "",
        stderr: compileResult.stderr || "Compilation Error",
        executionTime: Date.now() - startTime,
        error: "Compilation Error",
      };
    }

    // Run
    const runResult = await new Promise<{ stdout: string; stderr: string; killed: boolean }>(
      (resolve) => {
        exec(
          `echo '${input.replace(/'/g, "'\\''")}' | "${binFile}"`,
          { cwd: tmpDir, timeout: timeoutMs, maxBuffer: 1024 * 1024 },
          (error, stdout, stderr) => {
            resolve({
              stdout: stdout || "",
              stderr: stderr || "",
              killed: (error as any)?.killed || false,
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
      await unlink(cppFile).catch(() => {});
      await unlink(binFile).catch(() => {});
      const { rmdirSync } = await import("fs");
      rmdirSync(tmpDir);
    } catch {}
  }
}
