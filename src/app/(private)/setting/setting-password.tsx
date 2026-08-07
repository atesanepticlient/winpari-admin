"use client";

import React, { useState, useTransition } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import zod from "zod";
import {
  passwordChangeSchema,
  passwordMatcherSchema,
  VerificationCodeSchema,
} from "../../../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { matchCurrentPassword } from "@/action/password";
import { toast } from "sonner";
import { changePassword } from "../../../action/password";
import SettingHeader from "@/components/setting-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BsShieldFillCheck } from "react-icons/bs";
import { verifiyToken } from "@/action/verifiy";
const SettingPasswordChange = ({
  setOption,
}: {
  setOption: (option: "DISPLAY" | "PASSWORD" | "GMAIL") => void;
}) => {
  const [pending, startTransition] = useTransition();

  const [operationProgress, setOprationProgress] = useState<
    "INIT" | "CURRENT_PASS_VALID" | "VERIFIED" | "PASS_CHANGED"
  >("INIT");

  const passwordMatcherForm = useForm<zod.infer<typeof passwordMatcherSchema>>({
    defaultValues: {
      currentPassword: "",
    },
    resolver: zodResolver(passwordMatcherSchema),
  });

  const tokenVerificationForm = useForm<
    zod.infer<typeof VerificationCodeSchema>
  >({
    defaultValues: {
      token: "",
    },
    resolver: zodResolver(VerificationCodeSchema),
  });

  const passwordChangeForm = useForm<zod.infer<typeof passwordChangeSchema>>({
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
    resolver: zodResolver(passwordChangeSchema),
  });

  const handeCurrentPasswordMatch = (
    data: zod.infer<typeof passwordMatcherSchema>,
  ) => {
    startTransition(() => {
      matchCurrentPassword(data).then((res) => {
        console.log({ res });
        if (res.success) {
          setOprationProgress("CURRENT_PASS_VALID");
        } else if (res.error) {
          toast.error(res.error);
        }
      });
    });
  };

  const handleTokenVerification = (
    data: zod.infer<typeof VerificationCodeSchema>,
  ) => {
    startTransition(() => {
      verifiyToken(data).then((res) => {
        if (res.success) {
          setOprationProgress("VERIFIED");
        } else if (res.error) {
          toast.error(res.error);
        }
      });
    });
  };

  const handleChangePassword = (
    data: zod.infer<typeof passwordChangeSchema>,
  ) => {
    startTransition(() => {
      changePassword(data).then((res) => {
        if (res.success) {
          setOprationProgress("PASS_CHANGED");
          toast.success("Password Changed");
          setTimeout(() => {
            setOption("DISPLAY");
          }, 1000);
        } else if (res.error) {
          toast.error(res.error);
        }
      });
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <SettingHeader onClick={() => setOption("DISPLAY")} />
      </CardHeader>

      <CardContent>
        {operationProgress == "INIT" && (
          <>
            <Form {...passwordMatcherForm}>
              <form
                onSubmit={passwordMatcherForm.handleSubmit(
                  handeCurrentPasswordMatch,
                )}
              >
                <FormField
                  control={passwordMatcherForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={pending}
                          placeholder="Enter password"
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={pending} className="w-full mt-2">
                  Submit
                </Button>
              </form>
            </Form>
          </>
        )}
        {operationProgress == "CURRENT_PASS_VALID" && (
          <>
            <Form {...tokenVerificationForm}>
              <form
                onSubmit={tokenVerificationForm.handleSubmit(
                  handleTokenVerification,
                )}
              >
                <FormField
                  control={tokenVerificationForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={pending}
                          placeholder="Enter Code"
                          type="number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={pending} className="w-full mt-2">
                  Verify
                </Button>
              </form>
            </Form>
          </>
        )}

        {operationProgress == "VERIFIED" && (
          <>
            <Form {...passwordChangeForm}>
              <form
                onSubmit={passwordChangeForm.handleSubmit(handleChangePassword)}
              >
                <FormField
                  control={passwordChangeForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="mb-2">
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={pending}
                          placeholder="Enter password"
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordChangeForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={pending}
                          placeholder="Confirm password"
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={pending} className="w-full mt-2">
                  Change
                </Button>
              </form>
            </Form>
          </>
        )}

        {operationProgress == "PASS_CHANGED" && (
          <div className="flex items-center justify-center py-2 flex-col">
            <BsShieldFillCheck className="w-6 h-6 md:w-8 md:h-8 mx-auto" />
            <span className="text-sm md:text-base font-semibold block text-center mt-1">
              Password Changed
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SettingPasswordChange;
