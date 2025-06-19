// middleware.js
import { NextResponse } from 'next/server';

async function verifyVIPPhone(phone) {
  const url = 'https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec';
  const params = new URLSearchParams({ mode: 'password', password: phone });
  try {
    const res = await fetch(`${url}?${params}`);
    return (await res.text()).trim() === 'success';
  } catch {
    return false;
  }
}

export async function middleware(req) {
  const { pathname } = new URL(req.url);

  // 1) Let the static wrapper and any API calls through
  if (pathname === '/check.html' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2) Otherwise require Basic auth: "Authorization: Basic base64(phone:)"
  const auth = req.headers.get('authorization') || '';
  const [scheme, creds] = auth.split(' ');
  if (scheme !== 'Basic' || !creds) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Cliff House"' }
    });
  }

  // 3) Decode the phone number and verify it via Apps Script
  const phone = atob(creds).split(':')[0];
  if (await verifyVIPPhone(phone)) {
    return NextResponse.next();
  }

  // 4) Reject if not VIP
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Cliff House"' }
  });
}

export const config = {
  matcher: [
    // protect every path except /check.html and /api/*
    '/((?!check\\.html|api).*)'
  ]
};
