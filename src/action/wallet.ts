/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { findAdmin } from "@/data/admin";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";

import zod from "zod";
import {
  eWalletWithdrawInformationUpdateSchema,
  eWalletDepositInformationUpdateSchema,
} from "../../schema";

export const updateEWallet = async (
  isRecommended: boolean,
  isActive: boolean,
  eWalletId: string,
) => {
  try {
    const adminWallet: any = await db.adEWallet.findUnique({
      where: { eWalletId },
    });

    if (
      !adminWallet?.withdraw.min ||
      !adminWallet?.withdraw.max ||
      !adminWallet?.withdraw.range ||
      !adminWallet?.deposit.min ||
      !adminWallet?.deposit.max ||
      !adminWallet?.deposit.walletNumber ||
      !adminWallet?.deposit.range ||
      !adminWallet?.withdraw ||
      !adminWallet?.deposit
    ) {
      return { error: "Set All Wallet info First" };
    }
    const admin = await findAdmin();

    if (adminWallet) {
      await db.adEWallet.update({
        where: {
          eWalletId: eWalletId,
        },
        data: {
          isActive,
          isRecommended,
        },
      });
    } else {
      await db.adEWallet.create({
        data: {
          isActive,
          isRecommended,
          deposit: {},
          withdraw: {},
          admin: {
            connect: {
              id: admin!.id,
            },
          },
          eWallet: {
            connect: {
              id: eWalletId,
            },
          },
        },
      });
    }

    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const updateEWalletDeposit = async (
  data: zod.infer<typeof eWalletDepositInformationUpdateSchema>,
  eWalletId: string,
) => {
  try {
    const adminWallet = await db.adEWallet.findUnique({ where: { eWalletId } });

    const admin = await findAdmin();

    if (adminWallet) {
      await db.adEWallet.update({
        where: {
          eWalletId: eWalletId,
        },
        data: {
          deposit: data,
        },
      });
    } else {
      await db.adEWallet.create({
        data: {
          isRecommended: false,
          isActive: false,
          deposit: data,
          withdraw: {},
          admin: {
            connect: {
              id: admin!.id,
            },
          },
          eWallet: {
            connect: {
              id: eWalletId,
            },
          },
        },
      });
    }

    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const updateEWalletWithdraw = async (
  data: zod.infer<typeof eWalletWithdrawInformationUpdateSchema>,
  eWalletId: string,
) => {
  try {
    const adminWallet = await db.adEWallet.findUnique({ where: { eWalletId } });

    const admin = await findAdmin();
    if (adminWallet) {
      await db.adEWallet.update({
        where: {
          eWalletId: eWalletId,
        },
        data: {
          withdraw: data,
        },
      });
    } else {
      await db.adEWallet.create({
        data: {
          isRecommended: false,
          isActive: false,
          deposit: {},
          withdraw: data,
          admin: {
            connect: {
              id: admin!.id,
            },
          },
          eWallet: {
            connect: {
              id: eWalletId,
            },
          },
        },
      });
    }
    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};
