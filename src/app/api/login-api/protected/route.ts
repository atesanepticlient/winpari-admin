// /app/api/protected/route.ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

const getChromePath = () => {
  return process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/usr/bin/google-chrome";
};

export async function GET() {
  const browser = await puppeteer.launch({
    executablePath: getChromePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // ✅ Match user-agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/113.0.0.0 Safari/537.36"
  );

  try {
    // 🔐 Step 1: Go to login page
    await page.goto("https://asiaapi.net/index.php", {
      waitUntil: "networkidle2",
    });

    // 🔐 Step 2: Login
    await page.type("#login", process.env.API_USERNAME!);
    await page.type("#password", process.env.API_PASSWORD!);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click("#loginButton"),
    ]);

    // ✅ Optional: check if login successful
    const currentUrl = page.url();
    console.log("✅ After login URL:", currentUrl);

    // if (!currentUrl.includes("dashboard")) {
    //   await page.screenshot({ path: "login-fail.png" });
    //   throw new Error("Login failed. Check credentials.");
    // }

    // 🔐 Step 3: Navigate to protected route (same session)
    await page.goto(
      "https://asiaapi.net/index.php?act=hall&area=edit&hallId=941370",
      { waitUntil: "networkidle2" }
    );

    // 🧪 Debug screenshot
    await page.screenshot({ path: "protected-page.png", fullPage: true });

    // ✅ Step 4: Get HTML and return
    const html = await page.content();

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await browser.close();
  }
}
