import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

const getChromePath = () => {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  return process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/usr/bin/google-chrome";
};

export async function POST() {
  const browser = await puppeteer.launch({
    executablePath: getChromePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://asiaapi.net/index.php", {
    waitUntil: "networkidle0",
  });

  await page.type("#login", process.env.API_USERNAME!);
  await page.type("#password", process.env.API_PASSWORD!);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click("#loginButton"),
  ]);

  const cookies = await page.cookies();
  const session = cookies.find((c) => c.name === "PHPSESSID")?.value;

  await browser.close();

  return NextResponse.json({
    success: true,
    sessionData: {
      PHPSESSID: session,
    },
  });
}
