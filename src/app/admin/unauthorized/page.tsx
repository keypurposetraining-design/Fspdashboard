// src/app/admin/unauthorized/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Unauthorized() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home after a short delay
    const timer = setTimeout(() => router.replace('/'), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md rounded-xl border bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mb-4 text-gray-700">
          You do not have permission to view the Admin area.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to the home page...
        </p>
      </div>
    </div>
  );
}
