"use client";

import dynamic from "next/dynamic";

const LiveInterviewContent = dynamic(() => import("./LiveInterviewContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-white mt-4">Loading interview...</p>
      </div>
    </div>
  ),
});

export default function LiveInterviewPage() {
  return <LiveInterviewContent />;
}
