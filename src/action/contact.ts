"use server";

import { db } from "@/lib/db"; // adjust path as needed
import { contactSchema } from "../../schema";

export async function updateContactAction(formData: unknown) {
  const result = contactSchema.safeParse(formData);

  if (!result.success) {
    return {
      success: false,
      error: result.error.format(),
    };
  }

  const { ...data } = result.data;

  const contact = await db.contact.findFirst({ where: {} });

  try {
    await db.contact.update({
      where: { id: contact?.id },
      data,
    });

    return { success: true };
  } catch (error) {
    console.log("ERROR ", error);
    return {
      success: false,
      error: { error: "Failed to update contact info." },
    };
  }
}
