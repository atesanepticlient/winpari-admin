import { db } from "@/lib/db";

import bcrypt from "bcryptjs";

async function main() {
  // --- Configure the admin account here (or via env vars) ---
  // const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  // const twoFAEmail =
  //   process.env.SEED_ADMIN_2FA_EMAIL ?? "admin.2fa@example.com";
  // const fullName = process.env.SEED_ADMIN_NAME ?? "Super Admin";
  // const plainPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  // // ------------------------------------------------------------

  // const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // const admin = await db.admin.upsert({
  //   where: { email },
  //   update: {
  //     twoFAEmail,
  //     fullName,
  //     password: hashedPassword,
  //   },
  //   create: {
  //     email,
  //     twoFAEmail,
  //     fullName,
  //     password: hashedPassword,
  //   },
  // });

  // console.log("✅ Admin seeded:");
  // console.log({ id: admin.id, email: admin.email, fullName: admin.fullName });
  // console.log(
  //   `   Login password: ${plainPassword}  (hashed in DB — change after first login)`,
  // );


  await db.dollerRate.create({data : {}})
}

main()
  .catch((e) => {
    console.error("❌ Failed to seed admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
