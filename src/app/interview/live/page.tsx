"use client";

import dynamic from "next/dynamic";

const LiveInterviewContent = dynamic(() => import("./LiveInterviewContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-[#a78bfa] border-t-transparent mx-auto" />
        <p className="text-white mt-4">Loading interview...</p>
      </div>
    </div>
  ),
});

export default function LiveInterviewPage() {
  return <LiveInterviewContent />;
}
