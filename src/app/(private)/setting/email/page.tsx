/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { requestEmailChangeOtp, verifyAndChangeEmail } from "@/action/account";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { FaArrowLeftLong, FaEnvelope } from "react-icons/fa6";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import {
  requestEmailOtpSchema,
  RequestEmailOtpSchema,
  verifyEmailOtpSchema,
  VerifyEmailOtpSchema,
} from "../../../../../schema";

const EmailChangeForm = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");

  // Form for Step 1: Request OTP
  const requestForm = useForm<RequestEmailOtpSchema>({
    resolver: zodResolver(requestEmailOtpSchema),
    defaultValues: {
      currentPassword: "",
      newEmail: "",
    },
  });

  // Form for Step 2: Verify OTP
  const verifyForm = useForm<VerifyEmailOtpSchema>({
    resolver: zodResolver(verifyEmailOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Handler Step 1: Request OTP
  const onRequestOtp = (data: RequestEmailOtpSchema) => {
    startTransition(async () => {
      const res = await requestEmailChangeOtp(data);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setTargetEmail(data.newEmail);
      toast.success(res.message || "OTP code sent to your new email");
      setStep(2);
    });
  };

  // Handler Step 2: Verify OTP
  const onVerifyOtp = (data: VerifyEmailOtpSchema) => {
    startTransition(async () => {
      const res = await verifyAndChangeEmail(data);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message || "Email updated successfully");
      router.refresh();
      router.push("/");
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
          onClick={() => {
            if (step === 2) {
              setStep(1);
            } else {
              router.back();
            }
          }}
        >
          <FaArrowLeftLong className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
            {step === 1 ? (
              <FaEnvelope className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 1 ? "Change Email Address" : "Verify Email OTP"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {step === 1
              ? "Enter your current password and new email address to receive an OTP."
              : `Enter the 6-digit verification code sent to ${targetEmail}.`}
          </p>
        </div>

        {/* STEP 1: Request OTP Form */}
        {step === 1 && (
          <Form {...requestForm}>
            <form
              onSubmit={requestForm.handleSubmit(onRequestOtp)}
              className="space-y-5"
            >
              {/* Current Password */}
              <FormField
                control={requestForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <FormControl>
                      <div className="relative">
                        <Input
                          disabled={pending}
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
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

              {/* New Email */}
              <FormField
                control={requestForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="newEmail">New Email Address</Label>
                    <FormControl>
                      <Input
                        disabled={pending}
                        id="newEmail"
                        type="email"
                        placeholder="newadmin@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                disabled={pending}
                type="submit"
                className="w-full font-semibold cursor-pointer"
              >
                {pending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...
                  </span>
                ) : (
                  "Send OTP Code"
                )}
              </Button>
            </form>
          </Form>
        )}

        {/* STEP 2: Verify OTP Form */}
        {step === 2 && (
          <Form {...verifyForm}>
            <form
              onSubmit={verifyForm.handleSubmit(onVerifyOtp)}
              className="space-y-5"
            >
              <FormField
                control={verifyForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="otp">6-Digit Verification Code</Label>
                    <FormControl>
                      <Input
                        disabled={pending}
                        id="otp"
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        className="text-center text-lg tracking-widest font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                disabled={pending}
                type="submit"
                className="w-full font-semibold cursor-pointer"
              >
                {pending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </span>
                ) : (
                  "Confirm & Update Email"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setStep(1)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Didn't get a code or wrong email? Change email
                </button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default EmailChangeForm;
