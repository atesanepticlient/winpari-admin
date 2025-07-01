// lib/session.ts
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const COOKIE_PATH = join(process.cwd(), "sessionCookies.json");

export function setCookies(cookies: any[]) {
  try {
    writeFileSync(COOKIE_PATH, JSON.stringify(cookies, null, 2), "utf-8");
    console.log("✅ Cookies written to file");
  } catch (error) {
    console.error("❌ Failed to write cookies:", error);
  }
}

export function getCookies(): any[] {
  try {
    if (!existsSync(COOKIE_PATH)) {
      console.warn("⚠️ Cookie file does not exist");
      return [];
    }

    const data = readFileSync(COOKIE_PATH, "utf-8");
    const cookies = JSON.parse(data);
    console.log("✅ Cookies loaded:", cookies.length, "cookies");
    return cookies;
  } catch (error) {
    console.error("❌ Failed to read cookies:", error);
    return [];
  }
}
