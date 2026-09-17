import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#a78bfa]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-[#a78bfa]">404</span>
        </div>
        <h2 className="text-xl font-bold text-[#fafafa] mb-2">Page not found</h2>
        <p className="text-sm text-[#a1a1aa] mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-2.5 bg-[#a78bfa] text-white text-sm font-medium rounded-lg hover:bg-[#8b5cf6] transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
