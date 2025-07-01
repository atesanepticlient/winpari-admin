// /app/api/proxy/route.ts
import { NextResponse, NextRequest } from "next/server";

let sessionCookie = "";

export async function POST(req: NextRequest) {
  const body = await req.json();
  sessionCookie = body.session; // Store PHPSESSID cookie
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const urlPath = req.nextUrl.searchParams.get("url") || "/";
  console.log({ urlPath });
  const targetUrl = `https://asiaapi.net/index.php?act=hall&area=edit&hallId=941370`;

  const res = await fetch(targetUrl, {
    headers: {
      cookie: sessionCookie,
      // You can add other headers here if needed
    },
  });

  const contentType = res.headers.get("content-type") || "text/html";
  let body = await res.text();

  return new Response(body, {
    headers: {
      "content-type": contentType,
    },
    status: res.status,
  });
}
