/**
 * Code Execution Evaluator Server
 *
 * Express server that receives code execution requests,
 * runs them in isolated environments, and returns results.
 *
 * Security: Rate limiting, request validation, timeout enforcement.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { runJavaScript } from "./runners/javascript";
import { runPython } from "./runners/python";
import { runJava } from "./runners/java";
import { runCpp } from "./runners/cpp";
import { runGo } from "./runners/go";

const app = express();
const PORT = parseInt(process.env.SANDBOX_PORT || "8003", 10);

// Middleware
app.use(helmet());
app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"] }));
app.use(express.json({ limit: "100kb" }));

// Simple rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, limit: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Cleanup rate limit map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

interface ExecuteRequest {
  code: string;
  language: string;
  testCases: TestCase[];
  timeout?: number;
}

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "code-sandbox-evaluator" });
});

// Execute code against test cases
app.post("/execute", async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (!rateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const { code, language, testCases, timeout }: ExecuteRequest = req.body;

  // Validate
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code is required" });
  }
  if (code.length > 50000) {
    return res.status(400).json({ error: "Code exceeds 50KB limit" });
  }
  if (!language || !["javascript", "typescript", "python", "java", "cpp", "go"].includes(language)) {
    return res.status(400).json({ error: "Invalid language" });
  }
  if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
    return res.status(400).json({ error: "testCases array is required" });
  }
  if (testCases.length > 20) {
    return res.status(400).json({ error: "Maximum 20 test cases" });
  }

  const timeoutMs = Math.min(timeout || 10, 30) * 1000;
  const results: Array<{
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
    executionTime: number;
    error?: string;
  }> = [];

  let compilationError: string | undefined;
  let totalExecutionTime = 0;

  // Run against each test case
  for (const testCase of testCases) {
    const runner = getRunner(language);
    if (!runner) {
      return res.status(500).json({ error: `Runner not available for ${language}` });
    }

    const result = await runner(code, testCase.input, timeoutMs);
    totalExecutionTime += result.executionTime;

    // Check for compilation errors (only report once)
    if (result.error && isCompilationError(result.stderr, language)) {
      compilationError = result.stderr;
      results.push({
        passed: false,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: result.stderr,
        executionTime: result.executionTime,
        error: "Compilation Error",
      });
      break; // Don't run more test cases if compilation failed
    }

    // Compare output
    const actual = normalizeOutput(result.stdout);
    const expected = normalizeOutput(testCase.expectedOutput);
    const passed = actual === expected && !result.error;

    results.push({
      passed,
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: result.stdout || result.stderr || "",
      executionTime: result.executionTime,
      error: result.error,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;

  res.json({
    success: true,
    results,
    passedCount,
    totalCount: testCases.length,
    overallPassed: passedCount === testCases.length && !compilationError,
    compilationError,
    executionTime: totalExecutionTime,
  });
});

function getRunner(language: string) {
  switch (language) {
    case "javascript":
    case "typescript":
      return runJavaScript;
    case "python":
      return runPython;
    case "java":
      return runJava;
    case "cpp":
      return runCpp;
    case "go":
      return runGo;
    default:
      return null;
  }
}

function normalizeOutput(output: string): string {
  return output
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\s+$/gm, "")
    .toLowerCase();
}

function isCompilationError(stderr: string, language: string): boolean {
  const lower = stderr.toLowerCase();
  switch (language) {
    case "java":
      return lower.includes("error:") && lower.includes(".java");
    case "cpp":
      return lower.includes("error:") && (lower.includes(".cpp") || lower.includes("g++"));
    case "go":
      return lower.includes("error:") && lower.includes(".go");
    default:
      return false;
  }
}

app.listen(PORT, () => {
  console.log(`Code Sandbox Evaluator running on port ${PORT}`);
});
