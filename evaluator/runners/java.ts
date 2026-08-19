/**
 * Java runner using child_process.
 *
 * Writes user code to a temp .java file, compiles with javac,
 * and runs with java. Uses a hard timeout.
 */

import { exec, execFile } from "child_process";
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
 * Execute Java code with the given input.
 * The code should contain a class with a public static void main method,
 * or a Solution class with the method to test.
 */
export async function runJava(
  code: string,
  input: string,
  timeoutMs: number = 10000
): Promise<RunResult> {
  const startTime = Date.now();
  const jobId = randomUUID();
  const tmpDir = join(tmpdir(), `sandbox_java_${jobId}`);

  try {
    await mkdir(tmpDir, { recursive: true });

    // Extract class name from code or default to Main
    const classMatch = code.match(/class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : "Main";

    // If code doesn't have a main method, wrap it
    let fullCode = code;
    if (!code.includes("public static void main")) {
      fullCode = `
import java.util.*;

${code}

class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        Scanner scanner = new Scanner(System.in);
        String input = scanner.hasNextLine() ? scanner.nextLine() : "";
        // Try calling common method names
        try {
            String[] parts = input.substring(1, input.length() - 1).split(",");
            int[] nums = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {
                nums[i] = Integer.parseInt(parts[i].trim());
            }
            int result = solution.twoSum(nums, Integer.parseInt(args.length > 0 ? args[0] : "0"));
            System.out.println(result);
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}`;
    }

    const javaFile = join(tmpDir, `${className}.java`);
    await writeFile(javaFile, fullCode, "utf-8");

    // Compile
    const compileResult = await new Promise<{ stdout: string; stderr: string; code: number | null }>(
      (resolve) => {
        exec(
          `javac "${javaFile}"`,
          { cwd: tmpDir, timeout: 15000 },
          (error, stdout, stderr) => {
            resolve({
              stdout: stdout || "",
              stderr: stderr || "",
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
    const inputArgs = input.split("\n").filter(Boolean);
    const runResult = await new Promise<{ stdout: string; stderr: string; killed: boolean }>(
      (resolve) => {
        const child = exec(
          `java -cp "${tmpDir}" ${className} ${inputArgs.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`,
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
    // Clean up temp files
    try {
      const { readdirSync } = await import("fs");
      for (const file of readdirSync(tmpDir)) {
        await unlink(join(tmpDir, file)).catch(() => {});
      }
      await import("fs").then((fs) => fs.rmdirSync(tmpDir));
    } catch {}
  }
}
