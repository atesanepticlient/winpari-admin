/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { useUserSuspentionMutation } from "@/lib/features/userApiSlice";
import { suspensionSchema, SuspensionSchema } from "@/schema";
import { INTERNAL_SERVER_ERROR } from "@/error";

interface SuspensionModalProps {
  children: React.ReactNode;
  currentStatus: boolean; // true = banned, false = active
  id: string;
}

const SuspensionModal = ({
  children,
  currentStatus,
  id,
}: SuspensionModalProps) => {
  const [open, setOpen] = useState(false);

  const form = useForm<SuspensionSchema>({
    defaultValues: { id, message: "" },
    resolver: zodResolver(suspensionSchema),
  });

  const [suspensionApi, { isLoading }] = useUserSuspentionMutation();

  useEffect(() => {
    if (id) {
      form.setValue("id", id);
    }
  }, [id, form]);

  const handleSubmit = async (data: SuspensionSchema) => {
    const actionType = currentStatus ? "UNBAN" : "BAN";

    const asyncAction = async () => {
      const response = await suspensionApi({
        actionType,
        message: data.message,
        id: data.id,
      }).unwrap();
      return response.success;
    };

    toast.promise(asyncAction(), {
      loading: "Updating player account status...",
      success: () => {
        setOpen(false);
        form.reset({ id, message: "" });
        return `Account successfully ${currentStatus ? "Unbanned" : "Banned"}`;
      },
      error: (error: any) =>
        error?.data?.error
          ? `Error: ${error.data.error}`
          : INTERNAL_SERVER_ERROR,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-slate-800 bg-[#0d1527] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {currentStatus ? "Unban Account" : "Ban Account Access"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {currentStatus
              ? "Re-enable player access to gaming services and wallet functionality."
              : "Suspend player login access instantly across all active sessions."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pt-2"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-slate-300">
                    Reason / Internal Log Note
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Specify reason for audit logs..."
                      className="border-slate-800 bg-slate-900 text-white focus:border-blue-500 min-h-[90px] text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer font-semibold"
              variant={currentStatus ? "default" : "destructive"}
            >
              {isLoading
                ? "Executing..."
                : currentStatus
                  ? "Confirm Account Unban"
                  : "Confirm Ban Action"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SuspensionModal;
