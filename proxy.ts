import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const { nextUrl } = req

  const isAuthPage = nextUrl.pathname === '/login' || nextUrl.pathname === '/register'
  const isPatientPage = nextUrl.pathname.startsWith('/home') ||
    nextUrl.pathname.startsWith('/people') ||
    nextUrl.pathname.startsWith('/memories') ||
    nextUrl.pathname.startsWith('/talk')
  const isGuardianPage = nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/guardian')
  const isApiRoute = nextUrl.pathname.startsWith('/api')
  const isPublic = nextUrl.pathname === '/' || nextUrl.pathname.startsWith('/uploads')

  // Skip API routes and public paths
  if (isApiRoute || isPublic) return NextResponse.next()

  // Get session token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret',
  })

  const isLoggedIn = !!token
  const role = (token as any)?.role as string | undefined

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthPage) {
    if (role === 'patient') return NextResponse.redirect(new URL('/home', nextUrl))
    if (role === 'guardian') return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Protect patient routes
  if (!isLoggedIn && isPatientPage) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Protect guardian routes
  if (!isLoggedIn && isGuardianPage) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Role-based protection
  if (isLoggedIn && isPatientPage && role !== 'patient') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  if (isLoggedIn && isGuardianPage && role !== 'guardian') {
    return NextResponse.redirect(new URL('/home', nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
