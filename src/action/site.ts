"use server"; // <-- Ensure "use" is included here

import { db } from "@/lib/db";
import { bonusSettingUpdateSchema, BonusSettingUpdateSchema } from "@/schema";

export const updateBonusSettingAction = async (
  data: BonusSettingUpdateSchema,
) => {
  try {
    // 1. Validate incoming data
    const validatedFields = bonusSettingUpdateSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        error: "Invalid fields provided.",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const {
      firstPayin,
      firstPayinUpTo,
      referPayin,
      referPayinUpTo,
      inviationCode,
      inviationCodeUpTo,
    } = validatedFields.data;

    // 2. Upsert the global bonus settings
    const updatedBonusSetting = await db.bonusSetting.upsert({
      where: { id: "global" },
      update: {
        firstPayin,
        firstPayinUpTo,
        referPayin,
        referPayinUpTo,
        inviationCode,
        inviationCodeUpTo,
      },
      create: {
        id: "global",
        firstPayin,
        firstPayinUpTo,
        referPayin,
        referPayinUpTo,
        inviationCode,
        inviationCodeUpTo,
      },
    });

    return {
      success: true,
      message: "Bonus settings updated successfully.",
      payload: updatedBonusSetting,
    };
  } catch (error) {
    console.error("[UPDATE_BONUS_SETTING_ERROR]", error);
    return {
      error: "An error occurred while updating bonus settings.",
    };
  }
};
