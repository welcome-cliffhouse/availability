// middleware.js
import { NextResponse } from '@vercel/edge';

export const config = {
  runtime: 'edge',                       // ← tell Vercel to use its Edge Functions
  matcher: ['/((?!check\\.html|api).*)'] // ← protect everything except /check.html & /api/*
};

async function verifyVIPPhone(phone) {
  const url    = 'https://script.google.com/macros/s/…/exec';
  const params = new URLSearchParams({ mode: 'password', password: phone });
  try {
    const res = await fetch(`${url}?${params}`);
    return (await res.text()).trim() === 'success';
  } catch {
    return false;
  }
}

export default async function middleware(request) {
  const url = new URL(request.url);
  // 1) Always let check.html and any /api/* through
  if (url.pathname === '/check.html' || url.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2) Otherwise enforce Basic auth
  const auth = request.headers.get('authorization') || '';
  const [scheme, creds] = auth.split(' ');
  if (scheme !== 'Basic' || !creds) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Cliff House"' }
    });
  }

  // 3) Decode the phone number
  const phone = atob(creds).split(':')[0];
  if (await verifyVIPPhone(phone)) {
    return NextResponse.next();
  }

  // 4) Deny if not VIP
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Cliff House"' }
  });
}
