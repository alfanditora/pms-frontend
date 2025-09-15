import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    console.log('Middleware running for:', request.nextUrl.pathname)
    
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl
    
    console.log('Token exists:', !!token)
    console.log('Current pathname:', pathname)
    
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next()
    }
    
    if (!token && pathname !== '/login') {
        console.log('Redirecting to login - no token found')
        return NextResponse.redirect(new URL('/login', request.url))
    }
    
    if (token && pathname === '/login') {
        console.log('Redirecting to dashboard - token exists')
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    if (pathname === '/') {
        if (token) {
            console.log('Redirecting root to dashboard')
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
            console.log('Redirecting root to login')
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }
    
    console.log('Allowing request to continue')
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files) 
         * - favicon.ico (favicon file)
         * - img (image folder)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|img).*)',
    ],
}