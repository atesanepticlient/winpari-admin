import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Installing PostgreSQL DB Triggers...");

  // 1. Create the PL/pgSQL function
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION notify_admin_event()
    RETURNS trigger AS $$
    DECLARE
      payload JSON;
    BEGIN
      IF TG_TABLE_NAME = 'Users' THEN
        payload = json_build_object(
          'table', TG_TABLE_NAME,
          'action', TG_OP,
          'data', json_build_object(
            'id', NEW.id,
            'playerId', NEW."playerId",
            'email', NEW.email,
            'createdAt', NEW."createdAt"
          )
        );
      ELSIF TG_TABLE_NAME = 'Deposit' THEN
        payload = json_build_object(
          'table', TG_TABLE_NAME,
          'action', TG_OP,
          'data', json_build_object(
            'id', NEW.id,
            'amount', NEW.amount,
            'userId', NEW."userId",
            'createdAt', NEW."createdAt"
          )
        );
      ELSIF TG_TABLE_NAME = 'Withdraw' THEN
        payload = json_build_object(
          'table', TG_TABLE_NAME,
          'action', TG_OP,
          'data', json_build_object(
            'id', NEW.id,
            'amount', NEW.amount,
            'userId', NEW."userId",
            'createdAt', NEW."createdAt"
          )
        );
      END IF;

      PERFORM pg_notify('admin_db_events', payload::text);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 2. Attach trigger to Deposit
  await prisma.$executeRawUnsafe(
    `DROP TRIGGER IF EXISTS on_deposit_created ON "Deposit";`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER on_deposit_created
    AFTER INSERT ON "Deposit"
    FOR EACH ROW EXECUTE FUNCTION notify_admin_event();
  `);

  // 3. Attach trigger to Withdraw
  await prisma.$executeRawUnsafe(
    `DROP TRIGGER IF EXISTS on_withdraw_created ON "Withdraw";`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER on_withdraw_created
    AFTER INSERT ON "Withdraw"
    FOR EACH ROW EXECUTE FUNCTION notify_admin_event();
  `);

  // 4. Attach trigger to Users
  await prisma.$executeRawUnsafe(
    `DROP TRIGGER IF EXISTS on_user_created ON "Users";`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER on_user_created
    AFTER INSERT ON "Users"
    FOR EACH ROW EXECUTE FUNCTION notify_admin_event();
  `);

  console.log("✅ PostgreSQL DB Triggers installed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error setting up database triggers:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
