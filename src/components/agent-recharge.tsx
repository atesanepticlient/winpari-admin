"use client";
import React, { useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useForm } from "react-hook-form";
import zod from "zod";
import { agentRechargeSchema } from "../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { makeRecharge } from "@/action/recharge";
import { toast } from "sonner";

const AgentRecharge = ({
  children,
  id,
  isAgentVerified,
}: {
  children: React.ReactNode;
  id: string;
  isAgentVerified: boolean;
}) => {
  const [pending, startTransition] = useTransition();
  const form = useForm<zod.infer<typeof agentRechargeSchema>>({
    defaultValues: { amount: "" },
    resolver: zodResolver(agentRechargeSchema),
  });
  const handleMakeRecharge = (data: zod.infer<typeof agentRechargeSchema>) => {
    startTransition(() => {
      makeRecharge(data, id).then((res) => {
        if (res.success) {
          toast(`Successfull ${form.getValues("amount")} Found Transfered`);
        } else if (res.error) {
          toast(`Oh! ${res.error}`);
        }
      });
    });
  };
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <div>
          {!isAgentVerified && (
            <Alert className="mb-3">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Action Required!</AlertTitle>
              <AlertDescription>
                You verify this aget before make a recharge.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleMakeRecharge)}>
              <FormField
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter amount"
                        disabled={pending || !isAgentVerified}
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                control={form.control}
              />
              <Button
                disabled={pending || !isAgentVerified}
                className="w-full mt-3"
              >
                Recharge
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentRecharge;
