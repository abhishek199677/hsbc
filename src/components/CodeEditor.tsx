"use client";

/**
 * CodeEditor — Monaco Editor wrapper for Next.js.
 *
 * Uses dynamic import with SSR disabled since Monaco requires
 * browser-only APIs (window, document, etc.).
 */

import dynamic from "next/dynamic";
import { useCallback } from "react";
import { LANGUAGE_MAP, type ProgrammingLanguage } from "@/lib/sandbox";

// Dynamic import with SSR disabled — required for Monaco in Next.js
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-800 animate-pulse rounded-xl flex items-center justify-center">
      <span className="text-gray-500 text-sm">Loading editor...</span>
    </div>
  ),
});

interface Props {
  language: ProgrammingLanguage;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export default function CodeEditor({
  language,
  value,
  onChange,
  readOnly = false,
  height = "400px",
}: Props) {
  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(val || "");
    },
    [onChange]
  );

  const monacoLanguage = LANGUAGE_MAP[language] || "javascript";

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700">
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        onChange={handleChange}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 12 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          folding: true,
          bracketPairColorization: { enabled: true },
          cursorBlinking: "smooth",
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
