import cloudinary from "cloudinary";
import { NextRequest } from "next/server";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const POST = async (req: NextRequest) => {
  try {
    if (
      !process.env.CLOUDINARY_NAME ||
      !process.env.CLOUDINARY_API ||
      !process.env.CLOUDINARY_SECRET
    ) {
      console.error("Missing Cloudinary env vars");
      return Response.json(
        { message: "Server misconfigured", success: false },
        { status: 500 },
      );
    }

    const { timestamp } = await req.json();

    if (!timestamp) {
      return Response.json(
        { message: "Missing timestamp", success: false },
        { status: 400 },
      );
    }

    const signature = cloudinary.v2.utils.api_sign_request(
      { timestamp },
      process.env.CLOUDINARY_SECRET,
    );

    return Response.json(
      {
        payload: {
          signature,
          timestamp,
          cloud_name: process.env.CLOUDINARY_NAME,
          api_key: process.env.CLOUDINARY_API,
        },
        success: true,
        message: "Signed",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Sign-cloudinary error:", error);
    return Response.json(
      { message: "Unknown error, please try again", success: false },
      { status: 500 },
    );
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const { publicId } = await req.json();

    if (!publicId) {
      return Response.json(
        { message: "Missing publicId", success: false },
        { status: 400 }, // was 404 — this is a bad request, not "not found"
      );
    }

    const result = await cloudinary.v2.uploader.destroy(publicId);

    if (result.result !== "ok") {
      console.error("Cloudinary destroy failed:", result);
      return Response.json(
        { message: "Please try again", success: false },
        { status: 500 },
      );
    }

    return Response.json(
      { message: "Image deleted successfully", success: true },
      { status: 200 },
    );
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return Response.json(
      { message: "Unknown error, please try again", success: false },
      { status: 500 },
    );
  }
};
