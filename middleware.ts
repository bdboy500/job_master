import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all public routes, home, course lists, exam directories, and API routes
  // Guest users can browse freely without any auto-redirect or blocking logic.
  return NextResponse.next();
}

// Config matcher to skip static files, images, icons, and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, sw.js, service-worker.js, all images and static files
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|service-worker\\.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico|json|js)$).*)',
  ],
};
