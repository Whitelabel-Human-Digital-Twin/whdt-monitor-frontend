"use client";

import Link from "next/link";
import HdtManager from "@/components/HdtManager";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="mb-4">
        <Link
          href="/query-builder"
          className="inline-block bg-blue-600 px-4 py-2 rounded text-white"
        >
          Query Builder
        </Link>
      </div>

      <HdtManager />
    </main>
  );
}
