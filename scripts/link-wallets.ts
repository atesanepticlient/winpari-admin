// scripts/link-wallets.ts
import { db } from "@/lib/db";

async function main() {
  const deposits = await db.depositEWallet.findMany({
    where: { withdrawWalletId: null },
  });
  const withdraws = await db.withdrawEWallet.findMany({
    where: { depositWallet: { is: null } },
  });

  let linked = 0;
  const unmatchedDeposits: string[] = [];

  for (const dep of deposits) {
    const match = withdraws.find(
      (w) =>
        w.walletName.trim().toLowerCase() ===
        dep.walletName.trim().toLowerCase(),
    );

    if (match) {
      await db.depositEWallet.update({
        where: { id: dep.id },
        data: { withdrawWalletId: match.id },
      });
      linked++;
      // remove matched one so it can't be reused for a different deposit
      withdraws.splice(withdraws.indexOf(match), 1);
    } else {
      unmatchedDeposits.push(dep.walletName);
    }
  }

  console.log(`Linked ${linked} pairs.`);
  if (unmatchedDeposits.length) {
    console.log("No matching withdraw wallet found for:", unmatchedDeposits);
  }
  if (withdraws.length) {
    console.log(
      "Withdraw wallets with no matching deposit:",
      withdraws.map((w) => w.walletName),
    );
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
