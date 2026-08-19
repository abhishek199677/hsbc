"use client";

/**
 * CodingChallenge — Full coding challenge UI.
 *
 * Renders a split-panel layout:
 * - Left: Problem description (markdown)
 * - Right: Monaco Editor
 * - Bottom: Test results
 *
 * Supports running code against test cases and submitting for evaluation.
 */

import { useState, useCallback } from "react";
import CodeEditor from "./CodeEditor";
import {
  LANGUAGE_LABELS,
  type ChallengeQuestion,
  type TestCaseResult,
} from "@/lib/sandbox";
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  ChevronDown,
  ChevronUp,
  Terminal,
  FileCode,
} from "lucide-react";

interface Props {
  challenge: ChallengeQuestion;
  onSubmit: (code: string, results: TestCaseResult[], allPassed: boolean) => void;
  onSkip?: () => void;
  timeRemaining?: number;
}

export default function CodingChallenge({
  challenge,
  onSubmit,
  onSkip,
  timeRemaining,
}: Props) {
  const [code, setCode] = useState(challenge.starterCode);
  const [results, setResults] = useState<TestCaseResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [passedCount, setPassedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const runCode = useCallback(
    async (submit: boolean = false) => {
      setRunning(true);
      setResults(null);

      try {
        const testCases = submit
          ? challenge.testCases
          : challenge.testCases.filter((tc) => !tc.hidden);

        const res = await fetch("/api/sandbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            language: challenge.language,
            testCases,
            timeout: challenge.timeLimit || 10,
          }),
        });

        const data = await res.json();

        if (data.success) {
          setResults(data.results);
          setPassedCount(data.passedCount);
          setTotalCount(data.totalCount);
          setShowResults(true);

          if (submit) {
            onSubmit(code, data.results, data.overallPassed);
          }
        } else {
          setResults([
            {
              passed: false,
              input: "",
              expected: "",
              actual: data.error || "Execution failed",
              executionTime: 0,
              error: data.error,
            },
          ]);
        }
      } catch {
        setResults([
          {
            passed: false,
            input: "",
            expected: "",
            actual: "Failed to connect to sandbox",
            executionTime: 0,
            error: "Connection error",
          },
        ]);
      } finally {
        setRunning(false);
      }
    },
    [code, challenge, onSubmit]
  );

  const difficultyColor = {
    easy: "text-green-400 bg-green-500/10 border-green-500/30",
    medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    hard: "text-red-400 bg-red-500/10 border-red-500/30",
  }[challenge.difficulty];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <FileCode className="w-5 h-5 text-indigo-400" />
          <h2 className="text-white font-semibold">{challenge.title}</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${difficultyColor}`}>
            {challenge.difficulty.toUpperCase()}
          </span>
          <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
            {LANGUAGE_LABELS[challenge.language]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {timeRemaining !== undefined && (
            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}</span>
            </div>
          )}
          {results && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              passedCount === totalCount ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}>
              {passedCount === totalCount ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {passedCount}/{totalCount} passed
            </div>
          )}
        </div>
      </div>

      {/* Main content: Problem + Editor */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: Problem description */}
        <div className="w-1/2 border-r border-gray-700 overflow-y-auto p-5">
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
              {challenge.description}
            </div>

            {/* Examples */}
            {challenge.examples.length > 0 && (
              <div className="mt-5">
                <h3 className="text-white font-semibold text-sm mb-3">Examples</h3>
                {challenge.examples.map((ex, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-3 mb-3 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">Input:</div>
                    <code className="text-indigo-300 text-xs">{ex.input}</code>
                    <div className="text-xs text-gray-400 mt-2 mb-1">Output:</div>
                    <code className="text-green-300 text-xs">{ex.output}</code>
                    {ex.explanation && (
                      <>
                        <div className="text-xs text-gray-400 mt-2 mb-1">Explanation:</div>
                        <p className="text-gray-400 text-xs">{ex.explanation}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {challenge.constraints.length > 0 && (
              <div className="mt-5">
                <h3 className="text-white font-semibold text-sm mb-2">Constraints</h3>
                <ul className="space-y-1">
                  {challenge.constraints.map((c, i) => (
                    <li key={i} className="text-gray-400 text-xs">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Code editor */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 min-h-0">
            <CodeEditor
              language={challenge.language}
              value={code}
              onChange={setCode}
              height="100%"
            />
          </div>
        </div>
      </div>

      {/* Bottom panel: Actions + Results */}
      <div className="border-t border-gray-700">
        {/* Action buttons */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => runCode(false)}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 disabled:opacity-50 text-sm font-medium"
            >
              {running ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run
            </button>
            <button
              onClick={() => runCode(true)}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {running ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Submit
            </button>
          </div>
          <div className="flex items-center gap-3">
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Skip challenge
              </button>
            )}
            <button
              onClick={() => setShowResults(!showResults)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm"
            >
              <Terminal className="w-4 h-4" />
              Results
              {showResults ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Results panel */}
        {showResults && results && (
          <div className="max-h-48 overflow-y-auto bg-gray-900 px-4 py-3">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 py-2 border-b border-gray-800 last:border-0`}
              >
                {r.passed ? (
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Test {i + 1}</span>
                    <span className="text-xs text-gray-600">
                      {r.executionTime}ms
                    </span>
                  </div>
                  {!r.passed && (
                    <div className="mt-1 space-y-1 text-xs">
                      {r.input && (
                        <div>
                          <span className="text-gray-500">Input: </span>
                          <code className="text-gray-300">{typeof r.input === "object" ? JSON.stringify(r.input) : String(r.input)}</code>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Expected: </span>
                        <code className="text-green-400">{typeof r.expected === "object" ? JSON.stringify(r.expected) : String(r.expected)}</code>
                      </div>
                      <div>
                        <span className="text-gray-500">Got: </span>
                        <code className="text-red-400">{typeof r.actual === "object" ? JSON.stringify(r.actual) : String(r.actual)}</code>
                      </div>
                      {r.error && (
                        <div>
                          <span className="text-gray-500">Error: </span>
                          <code className="text-red-400">{r.error}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showResults && !results && (
          <div className="px-4 py-6 text-center text-gray-500 text-sm">
            Click &quot;Run&quot; to test your code, or &quot;Submit&quot; to submit your solution.
          </div>
        )}
      </div>
    </div>
  );
}
