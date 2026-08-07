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
import { gmailChangeSchema, VerificationCodeSchema } from "../../../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SettingHeader from "@/components/setting-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BsShieldFillCheck } from "react-icons/bs";
import { IoInformationCircle } from "react-icons/io5";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { changeEmail, sendVerificationEmail } from "@/action/gmail";
import { verifiyToken } from "@/action/verifiy";
import { FaInfoCircle } from "react-icons/fa";
const SettingGmailChange = ({
  setOption,
}: {
  setOption: (option: "DISPLAY" | "PASSWORD" | "GMAIL" | "VERIFY") => void;
}) => {
  const [pending, startTransition] = useTransition();

  const [operationProgress, setOprationProgress] = useState<
    "INIT" | "VERIFICATION_MAIL_SENT" | "VERIFIED" | "GMAIL_CHANGED"
  >("INIT");

  const tokenVerificationForm = useForm<
    zod.infer<typeof VerificationCodeSchema>
  >({
    defaultValues: {
      token: "",
    },
    resolver: zodResolver(VerificationCodeSchema),
  });

  const gmailChangeForm = useForm<zod.infer<typeof gmailChangeSchema>>({
    defaultValues: {
      newGmail: "",
    },
    resolver: zodResolver(gmailChangeSchema),
  });

  const handleSentVerificationEmail = () => {
    startTransition(() => {
      sendVerificationEmail().then((res) => {
        console.log({ res });
        if (res.success) {
          setOprationProgress("VERIFICATION_MAIL_SENT");
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

  const handleChangeEmail = (data: zod.infer<typeof gmailChangeSchema>) => {
    startTransition(() => {
      changeEmail(data).then((res) => {
        if (res.success) {
          setOprationProgress("GMAIL_CHANGED");
          toast.success("Email Changed");
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
            <Alert>
              <IoInformationCircle className="h-4 w-4" />
              <AlertTitle>Securiry Alert!</AlertTitle>
              <AlertDescription>
                You have to Proof that your account! For That We will send a
                Verification Code to your Current Gmail.
              </AlertDescription>
            </Alert>

            <Button
              disabled={pending}
              onClick={handleSentVerificationEmail}
              className="w-full mt-3"
            >
              Yes, Send
            </Button>
          </>
        )}

        {operationProgress == "VERIFICATION_MAIL_SENT" && (
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
            <Form {...gmailChangeForm}>
              <form onSubmit={gmailChangeForm.handleSubmit(handleChangeEmail)}>
                <FormField
                  control={gmailChangeForm.control}
                  name="newGmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Gmail</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={pending}
                          placeholder="Enter New Gmail"
                          type="text"
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

        {operationProgress == "GMAIL_CHANGED" && (
          <>
            <Alert className="relative">
              <FaInfoCircle className="h-4 w-4" />
              <AlertTitle>Important!</AlertTitle>
              <AlertDescription>
                Your New Gmail Added. Now you can login with the new Gmail. But
                Verifiy the Gmail to get 2FA code.
              </AlertDescription>
              <Button
                className="absolute top-1/2 -translate-y-1/2 right-2"
                onClick={() => setOption("VERIFY")}
              >
                Verify
              </Button>
            </Alert>
            <div className="flex items-center justify-center py-2 flex-col mt-4">
              <BsShieldFillCheck className="w-6 h-6 md:w-8 md:h-8 mx-auto" />
              <span className="text-sm md:text-base font-semibold block text-center mt-1">
                Gmail Changed
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SettingGmailChange;
