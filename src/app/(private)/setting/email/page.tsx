/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  adminPasswordChangeSchema,
  PasswordChangeSchema,
} from "../../../../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FaKey, FaArrowLeftLong } from "react-icons/fa6";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { passwordChange } from "@/action/account";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const PasswordChangeForm = () => {
  const router = useRouter();
  const [pending, startTr] = useTransition();

  // Visibility Toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm<PasswordChangeSchema>({
    resolver: zodResolver(adminPasswordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const onSubmit = (data: PasswordChangeSchema) => {
    startTr(() => {
      const asyncAction = async () => {
        const response = await passwordChange(data);
        if (response?.error) {
          throw new Error(response.error);
        }

        form.reset();
        router.refresh();
        router.push("/account");
        return response?.success || "Password changed successfully";
      };

      toast.promise(asyncAction(), {
        loading: "Updating password...",
        success: (msg) => `${msg}`,
        error: (err: any) => `${err.message || "Failed to update password"}`,
      });
    });
  };

  return (
    <div className="w-full min-h-[80vh] flex justify-center items-center bg-background px-4">
      <div className="relative w-full max-w-md mx-auto p-6 md:p-8 shadow-xl rounded-2xl border bg-card text-card-foreground space-y-6">
        {/* Back Button */}
        <Button
          className="absolute -top-12 left-0 sm:-left-4"
          variant="outline"
          size="icon"
          aria-label="Back"
          onClick={() => router.back()}
        >
          <FaArrowLeftLong className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
            <FaKey className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Change Password</h1>
          <p className="text-xs text-muted-foreground">
            Enter your current password to set up a new password.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Current Password Field */}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <FormControl>
                    <div className="relative">
                      <Input
                        disabled={pending}
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Password Field */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="newPassword">New Password</Label>
                  <FormControl>
                    <div className="relative">
                      <Input
                        disabled={pending}
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              disabled={pending}
              type="submit"
              className="w-full font-semibold cursor-pointer"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                </span>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PasswordChangeForm;
