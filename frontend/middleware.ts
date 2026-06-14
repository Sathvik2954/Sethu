import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const isPublicPage = path === '/' ||
                        path.startsWith('/login') ||
                        path.startsWith('/signup') ||
                        path.startsWith('/auth')

  // Supabase stores the session in a cookie named like
  // "sb-<project-ref>-auth-token" (sometimes split into
  // "...-auth-token.0", "...-auth-token.1" for large sessions).
  const hasSession = request.cookies.getAll().some(
    cookie => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  )

  if (!hasSession && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasSession && (path.startsWith('/login') || path.startsWith('/signup'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}