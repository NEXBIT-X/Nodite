"use client";

import Link from "next/link";

export default function RootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-8 px-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-zinc-100 mb-3">Nodite</h1>
          <p className="text-lg text-zinc-400">Visual API workflow builder</p>
        </div>

        <Link
          href="/dashboard"
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-emerald-900/50"
        >
          Go to Dashboard
        </Link>

        <div className="mt-12 max-w-2xl text-center space-y-4 text-zinc-400 text-sm">
          <p>Design API workflows with an intuitive visual canvas.</p>
          <p>Define routers, methods, and responses. Deploy and run instantly.</p>
        </div>
      </div>
    </div>
  );
}
