import { Prisma } from "@prisma/client";
import React, { useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

import zod from "zod";
import { addBankingSchema } from "../../../../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { addBanking } from "@/action/banking";
import { toast } from "sonner";

const AddNewBanking = ({
  wallet,
}: {
  wallet: Prisma.eWalletGetPayload<{ include: { admin: true } }>[];
}) => {
  return (
    <div>
      <AddDialog wallet={wallet}>
        <Button>Add Wallet</Button>
      </AddDialog>
    </div>
  );
};

const AddDialog = ({
  children,
  wallet,
}: {
  children: React.ReactNode;
  wallet: Prisma.eWalletGetPayload<{ include: { admin: true } }>[];
}) => {
  const [pending, startTransition] = useTransition();
  const form = useForm<zod.infer<typeof addBankingSchema>>({
    defaultValues: {
      bankingId: "",
    },
    resolver: zodResolver(addBankingSchema),
  });

  const handleAddWallet = (data: zod.infer<typeof addBankingSchema>) => {
    startTransition(() => {
      addBanking(data).then((res) => {
        if (res.success) {
          location.reload();
        } else if (res.error) {
          toast.error(res.error);
        }
      });
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Wallet</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddWallet)}>
              <div className="flex items-end justify-between gap-2">
                <div className="flex-1">
                  <FormField
                    name="bankingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Wallet</FormLabel>
                        <FormControl>
                          <Select
                            disabled={pending}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Wallet" />
                            </SelectTrigger>
                            <SelectContent>
                              {wallet.map((w, i) => (
                                <SelectItem
                                  value={w.id}
                                  key={i}
                                  className="flex items-center gap-2"
                                >
                                  <Image
                                    src={w.image}
                                    className="w-[20px] h-[15px]"
                                    alt={w.walletName}
                                    width={20}
                                    height={15}
                                  />
                                  {w.walletName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                    control={form.control}
                  />
                </div>

                <Button disabled={pending}>Add</Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewBanking;
