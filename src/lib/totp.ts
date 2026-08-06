import QRCode from "qrcode";

export const generateTOTPSecret = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i++) {
    secret += chars[bytes[i] % chars.length];
  }
  return secret;
};

export const generateQRCode = async (email: string, secret: string) => {
  const otpauth = `otpauth://totp/WinpariBet:${encodeURIComponent(
    email,
  )}?secret=${secret}&issuer=WinpariBet&algorithm=SHA1&digits=6&period=30`;
  return QRCode.toDataURL(otpauth);
};

export const verifyTOTPToken = async (token: string, secret: string) => {
  try {
    const cleanToken = token.replace(/\s+/g, "").trim();
    if (!/^\d{6}$/.test(cleanToken)) return false;

    // Standard TOTP timestep calculation
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30;

    // Check current step, previous step (-30s), and next step (+30s) for clock drift
    for (let i = -1; i <= 1; i++) {
      const counter = Math.floor(epoch / timeStep) + i;
      const generatedToken = await generateHOTP(secret, counter);
      if (generatedToken === cleanToken) return true;
    }
    return false;
  } catch {
    return false;
  }
};

// Internal HOTP computation via standard Web Crypto
async function generateHOTP(secret: string, counter: number): Promise<string> {
  const keyBytes = base32ToBuffer(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter), false);

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, buffer);
  const sigBytes = new Uint8Array(signature);
  const offset = sigBytes[sigBytes.length - 1] & 0xf;

  const binary =
    ((sigBytes[offset] & 0x7f) << 24) |
    ((sigBytes[offset + 1] & 0xff) << 16) |
    ((sigBytes[offset + 2] & 0xff) << 8) |
    (sigBytes[offset + 3] & 0xff);

  return (binary % 1000000).toString().padStart(6, "0");
}

function base32ToBuffer(base32: string): Uint8Array {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (let i = 0; i < base32.length; i++) {
    const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    if (val !== -1) bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}
