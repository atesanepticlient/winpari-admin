/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Facebook,
  Mail,
  Instagram,
  Twitter,
  Youtube,
  Send,
} from "lucide-react";
import { useFetchContactQuery } from "@/lib/features/contactApiSlice";
import { useEffect } from "react";
import { ContactFormData, contactSchema } from "../../../../schema";
import { updateContactAction } from "@/action/contact";
import { toast } from "sonner";
import CookieLoader from "@/components/loader/cooki-loader";

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });
  const { data, isLoading } = useFetchContactQuery();
  const contact = data?.payload;

  const onSubmit = (data: ContactFormData) => {
    const asyncAction = async () => {
      const response = await updateContactAction(data);
      if (response.error || !response.success) {
        throw new Error("Failed to update contact info.");
      }
      return true;
    };

    toast.promise(asyncAction(), {
      loading: "Updating...",
      success: () => "Contact Updated",
      error: (error: any) => {
        return error.message;
      },
    });
  };

  useEffect(() => {
    if (contact) {
      reset({
        email: contact.email || "",
        facebook: contact.facebook || "",
        youtube: contact.youtube || "",
        instagram: contact.instagram || "",
        telegram: contact.telegram || "",
        twitter: contact.twitter || "",
      });
    }
  }, [contact]);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-[85vh] justify-center items-center">
          <CookieLoader />
        </div>
      )}

      {data && !isLoading && (
        <Card className="max-w-2xl mx-auto mt-10">
          <CardHeader>
            <CardTitle className="text-center">Contact</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-2 gap-6"
            >
              {/* Facebook */}
              <div className="space-y-1">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" /> Facebook
                </Label>
                <Input
                  id="facebook"
                  {...register("facebook")}
                  placeholder="https://facebook.com/yourpage"
                />
                {errors.facebook && (
                  <p className="text-sm text-red-500">
                    {errors.facebook.message}
                  </p>
                )}
              </div>

              {/* Telegram */}
              <div className="space-y-1">
                <Label htmlFor="telegram" className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> Telegram
                </Label>
                <Input
                  id="telegram"
                  {...register("telegram")}
                  placeholder="https://t.me/yourchannel"
                />
                {errors.telegram && (
                  <p className="text-sm text-red-500">
                    {errors.telegram.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  id="email"
                  {...register("email")}
                  placeholder="admin@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Instagram */}
              <div className="space-y-1">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" /> Instagram
                </Label>
                <Input
                  id="instagram"
                  {...register("instagram")}
                  placeholder="https://instagram.com/yourprofile"
                />
                {errors.instagram && (
                  <p className="text-sm text-red-500">
                    {errors.instagram.message}
                  </p>
                )}
              </div>

              {/* Twitter */}
              <div className="space-y-1">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" /> Twitter
                </Label>
                <Input
                  id="twitter"
                  {...register("twitter")}
                  placeholder="https://twitter.com/yourhandle"
                />
                {errors.twitter && (
                  <p className="text-sm text-red-500">
                    {errors.twitter.message}
                  </p>
                )}
              </div>

              {/* YouTube */}
              <div className="space-y-1">
                <Label htmlFor="youtube" className="flex items-center gap-2">
                  <Youtube className="w-4 h-4" /> YouTube
                </Label>
                <Input
                  id="youtube"
                  {...register("youtube")}
                  placeholder="https://youtube.com/yourchannel"
                />
                {errors.youtube && (
                  <p className="text-sm text-red-500">
                    {errors.youtube.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="col-span-2">
                <Button type="submit" className="w-full">
                  Update Contact Info
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
