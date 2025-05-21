'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Use dynamic import with SSR disabled for the 3D game component
// since it uses browser APIs like requestAnimationFrame and THREE.js
const CraneGame3D = dynamic(() => import('../components/CraneGame3D'), {
  ssr: false,
  loading: () => <div className="text-center p-4">Loading 3D crane game...</div>
});

export default function Home() {
  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50">
      <Suspense fallback={<div className="text-center p-4">Loading 3D crane game...</div>}>
        <CraneGame3D />
      </Suspense>
    </div>
  );
}
