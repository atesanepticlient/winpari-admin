import { headers } from "next/headers";

export const getClientIp = async (): Promise<string> => {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  if (realIp) return realIp;
  return "unknown";
};

export const isIpWhitelisted = (ip: string, whitelist: string[]): boolean => {
  if (!whitelist || whitelist.length === 0) return true;
  return whitelist.includes(ip);
};