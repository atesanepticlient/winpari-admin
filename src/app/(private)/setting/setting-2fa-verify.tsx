"use client";
import SettingHeader from "@/components/setting-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React, { useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IoInformationCircle } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { send2FAVerificationEmail, verify2FAEmail } from "@/action/gmail";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { VerificationCodeSchema } from "../../../../schema";
import { Input } from "@/components/ui/input";
import { BsShieldFillCheck } from "react-icons/bs";
const Setting2FAVerify = ({
  setOption,
}: {
  setOption: (option: "DISPLAY" | "PASSWORD" | "GMAIL" | "VERIFY") => void;
}) => {
  const [pending, startTransition] = useTransition();
  const [operationProgress, setOprationProgress] = useState<
    "INIT" | "SENT" | "VERIFIED"
  >("INIT");

  const tokenVerificationForm = useForm<
    zod.infer<typeof VerificationCodeSchema>
  >({
    defaultValues: {
      token: "",
    },
    resolver: zodResolver(VerificationCodeSchema),
  });

  const handleSendVerification = () => {
    startTransition(() => {
      send2FAVerificationEmail().then((res) => {
        if (res.success) {
          setOprationProgress("SENT");
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
      verify2FAEmail(data).then((res) => {
        if (res.success) {
          setOprationProgress("VERIFIED");

          toast.success("Verified");
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
    <Card>
      <CardHeader>
        <SettingHeader onClick={() => setOption("DISPLAY")} />
      </CardHeader>
      <CardContent>
        {operationProgress == "INIT" && (
          <>
            <Alert>
              <IoInformationCircle className="h-4 w-4" />
              <AlertTitle>Securiry Alert!</AlertTitle>
              <AlertDescription>
                Send A Verification Email to verify your 2FA Email
              </AlertDescription>
            </Alert>

            <Button
              disabled={pending}
              onClick={handleSendVerification}
              className="w-full mt-3"
            >
              Yes, Send
            </Button>
          </>
        )}

        {operationProgress == "SENT" && (
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
        )}

        {operationProgress == "VERIFIED" && (
          <>
            <div className="flex items-center justify-center py-2 flex-col mt-4">
              <BsShieldFillCheck className="w-6 h-6 md:w-8 md:h-8 mx-auto" />
              <span className="text-sm md:text-base font-semibold block text-center mt-1">
                Verified
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Setting2FAVerify;
