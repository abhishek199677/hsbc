/**
 * Types and helpers for the code execution sandbox system.
 *
 * The sandbox runs user-submitted code in isolated Docker containers
 * and returns structured results (pass/fail, output, execution time).
 */

export type ProgrammingLanguage = "javascript" | "typescript" | "python" | "java" | "cpp" | "go";

export interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface SandboxRequest {
  code: string;
  language: ProgrammingLanguage;
  testCases: TestCase[];
  timeout?: number;
}

export interface TestCaseResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  executionTime: number;
  error?: string;
}

export interface SandboxResult {
  success: boolean;
  results: TestCaseResult[];
  passedCount: number;
  totalCount: number;
  overallPassed: boolean;
  compilationError?: string;
  executionTime: number;
}

export interface ChallengeQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  language: ProgrammingLanguage;
  starterCode: string;
  testCases: TestCase[];
  constraints: string[];
  examples: { input: string; output: string; explanation: string }[];
  timeLimit: number;
}

/** Map of language ID to Monaco editor language name */
export const LANGUAGE_MAP: Record<ProgrammingLanguage, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
  go: "go",
};

/** Map of language to display name */
export const LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  go: "Go",
};

/** Map of language to file extension */
export const LANGUAGE_EXTENSIONS: Record<ProgrammingLanguage, string> = {
  javascript: ".js",
  typescript: ".ts",
  python: ".py",
  java: ".java",
  cpp: ".cpp",
  go: ".go",
};
