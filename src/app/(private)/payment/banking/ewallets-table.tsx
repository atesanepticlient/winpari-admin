/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Prisma } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import zod from "zod";
import {
  eWalletDepositInformationUpdateSchema,
  eWalletWithdrawInformationUpdateSchema,
} from "../../../../../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FaRegStar, FaStar } from "react-icons/fa6";
import {
  updateEWalletDeposit,
  updateEWallet,
  updateEWalletWithdraw,
} from "@/action/wallet";
import { toast } from "sonner";
import { MdDelete } from "react-icons/md";

interface EwalletsTablesProps {
  wallets: Prisma.eWalletGetPayload<{ include: { admin: true } }>[];
}

const EwalletsTables = ({ wallets }: EwalletsTablesProps) => {
  return (
    <Table>
      <TableCaption>A list of E-Wallets</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Wallet</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Deposit</TableHead>
          <TableHead>Withdraw</TableHead>
          <TableHead>Recommended</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Delete</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {wallets.map((w, i) => (
          <TableRow key={i}>
            <TableCell>
              <Image
                src={w.image}
                alt={w.walletName}
                width={40}
                height={20}
                className="w-[30px] md:w-[40px] h-[20px] object-cover"
              />
            </TableCell>
            <TableCell>{w.walletName}</TableCell>

            <TableCell>
              <UpdateDialog
                eWalletId={w.id}
                defautTab="deposit"
                deposit={w?.admin?.deposit}
                withdraw={w?.admin?.withdraw}
                isRecommended={
                  w.admin?.isRecommended ? w.admin?.isRecommended : false
                }
                isActive={w.admin?.isActive ? w.admin?.isActive : false}
              >
                <span className="p-1 bg-indigo-600 text-xs cursor-pointer rounded-sm text-white">
                  Desposit$
                </span>
              </UpdateDialog>
            </TableCell>

            <TableCell>
              <UpdateDialog
                eWalletId={w.id}
                defautTab="withdraw"
                withdraw={w?.admin?.withdraw}
                deposit={w?.admin?.deposit}
                isRecommended={
                  w.admin?.isRecommended ? w.admin?.isRecommended : false
                }
                isActive={w.admin?.isActive ? w.admin?.isActive : false}
              >
                <span className="p-1 bg-teal-600 text-xs cursor-pointer rounded-sm text-white">
                  Withdraw$
                </span>
              </UpdateDialog>
            </TableCell>

            <TableCell>
              {w.admin?.isRecommended && (
                <FaStar className="w-4 h-4 md:w-5 md:h-5 " />
              )}
              {!w.admin?.isRecommended && (
                <FaRegStar className="w-4 h-4 md:w-5 md:h-5 " />
              )}
            </TableCell>

            <TableCell
              className={` ${
                w?.admin?.isActive ? "text-emerald-500" : "text-destructive"
              }`}
            >
              {w?.admin?.isActive ? "Active" : "InActive"}
            </TableCell>

            <TableCell className={`text-right `}>
              <Button variant={"destructive"}>
                <MdDelete />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const UpdateDialog = ({
  withdraw,
  deposit,
  defautTab,
  isRecommended,
  isActive,
  children,
  eWalletId,
}: {
  withdraw?: any;
  deposit?: any;
  defautTab: string;
  isRecommended: boolean;
  isActive: boolean;
  children: React.ReactNode;
  eWalletId: string;
}) => {
  console.log("withdraw", withdraw);
  console.log("deposit", deposit);
  const [pending, startTransition] = useTransition();

  const form = useForm<
    zod.infer<typeof eWalletWithdrawInformationUpdateSchema>
  >({
    defaultValues: {
      min: "",
      max: "",
      range: [],
    },
    resolver: zodResolver(eWalletWithdrawInformationUpdateSchema),
  });

  const form2 = useForm<
    zod.infer<typeof eWalletDepositInformationUpdateSchema>
  >({
    defaultValues: {
      min: "",
      max: "",
      walletNumber: "",
      range: [],
    },
    resolver: zodResolver(eWalletDepositInformationUpdateSchema),
  });

  useEffect(() => {
    if (deposit) {
      form2.reset({
        min: deposit.min,
        max: deposit.max,
        range: deposit.range,
        walletNumber: deposit.walletNumber,
      });
    }
  }, [deposit]);

  useEffect(() => {
    if (withdraw) {
      form.reset({
        min: withdraw.min,
        max: withdraw.max,
        range: withdraw.range,
      });
    }
  }, [withdraw]);

  const [statusActive, setStatusActive] = useState(false);
  const [recommened, setRecommened] = useState(false);

  const handleToggle = () => {
    setRecommened(!recommened);
  };

  const handleSave = () => {
    startTransition(() => {
      updateEWallet(recommened, statusActive, eWalletId).then((res) => {
        if (res.success) {
          toast("Wallet updated");
        } else if (res.error) {
          toast(`Oh! ${res.error}`);
        }
      });
    });
  };

  const handleDepositUpdate = (
    data: zod.infer<typeof eWalletDepositInformationUpdateSchema>,
  ) => {
    startTransition(() => {
      updateEWalletDeposit(data, eWalletId).then((res) => {
        if (res.success) {
          toast("Wallet updated");
        } else if (res.error) {
          toast(`Oh! ${res.error}`);
        }
      });
    });
  };

  const handleWithdrawUpdate = (
    data: zod.infer<typeof eWalletWithdrawInformationUpdateSchema>,
  ) => {
    startTransition(() => {
      updateEWalletWithdraw(data, eWalletId).then((res) => {
        if (res.success) {
          toast("Wallet updated");
        } else if (res.error) {
          toast(`Oh! ${res.error}`);
        }
      });
    });
  };

  useEffect(() => {
    setRecommened(isRecommended);
  }, [isRecommended]);

  useEffect(() => {
    setStatusActive(isActive);
  }, [isActive]);
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Your Wallet</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={defautTab} className="w-full mt-3">
          <TabsList className="mb-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            {" "}
            <div>
              <Form {...form2}>
                <form onSubmit={form2.handleSubmit(handleDepositUpdate)}>
                  <FormField
                    control={form2.control}
                    name="walletNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Number</FormLabel>
                        <FormControl>
                          <Input
                            disabled={pending}
                            {...field}
                            type="number"
                            placeholder="e.g.2000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-3 my-3">
                    <FormField
                      control={form2.control}
                      name="max"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Max Withdraw</FormLabel>
                          <FormControl>
                            <Input
                              disabled={pending}
                              {...field}
                              type="number"
                              placeholder="e.g.2000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form2.control}
                      name="min"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Min Withdraw</FormLabel>
                          <FormControl>
                            <Input
                              disabled={pending}
                              {...field}
                              type="number"
                              placeholder="e.g.200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form2.control}
                    name="range"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Set Deposit Range</FormLabel>
                        <FormControl>
                          <Input
                            disabled={pending}
                            value={field.value?.join(",") || ""}
                            onChange={(e) =>
                              form2.setValue("range", e.target.value.split(","))
                            }
                            type="text"
                            placeholder="e.g.200,500,1000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    disabled={pending}
                    variant={"secondary"}
                    className="w-full mt-2"
                  >
                    Update Deposit
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>
          <TabsContent value="withdraw">
            <div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleWithdrawUpdate)}>
                  <div className="flex items-center gap-3 my-3">
                    <FormField
                      control={form.control}
                      name="max"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Max Withdraw</FormLabel>
                          <FormControl>
                            <Input
                              disabled={pending}
                              {...field}
                              type="number"
                              placeholder="e.g.2000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="min"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Min Withdraw</FormLabel>
                          <FormControl>
                            <Input
                              disabled={pending}
                              {...field}
                              type="number"
                              placeholder="e.g.200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="range"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Set Withdraw Range</FormLabel>
                        <FormControl>
                          <Input
                            disabled={pending}
                            value={field.value?.join(",") || ""}
                            onChange={(e) =>
                              form.setValue("range", e.target.value.split(","))
                            }
                            type="text"
                            placeholder="e.g.200,500,1000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    disabled={pending}
                    variant={"secondary"}
                    className="w-full mt-2"
                  >
                    Update Withdraw
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between mt-3">
          <span className="text-sm">Status</span>
          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              onCheckedChange={(check) => setStatusActive(check)}
            />
            <Label
              htmlFor="status"
              className={`${
                statusActive ? "text-emerald-600" : "text-destructive"
              }`}
            >
              {statusActive ? "Active" : "InActive"}
            </Label>
          </div>
        </div>

        <div className="flex items-center justify-between ">
          <span className="text-sm">Make It Recommended</span>
          <div className="flex items-center space-x-2">
            <label htmlFor="recommended">
              <button className="" onClick={handleToggle}>
                {recommened ? (
                  <FaStar className="w-4 h-4 md:w-5 md:h-5 " />
                ) : (
                  <FaRegStar className="w-4 h-4 md:w-5 md:h-5 " />
                )}
              </button>
            </label>
            <input className="hidden" id="recommended" type="checkbox" />
          </div>
        </div>

        <DialogFooter>
          <Button disabled={pending} onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// const MultipleInput = ({
//   onChange,
//   label,
//   defaultvalues,
// }: {
//   onChange: (values: string[]) => void;
//   label: string;
//   defaultvalues: string[];
// }) => {
//   const [values, setValues] = useState<string[]>([""]);

//   const handleAddInput = () => {
//     if (values.length > 4) {
//       return toast("Canno be added anymore");
//     }
//     setValues((state) => [...state, ""]);
//   };

//   useEffect(() => {
//     console.log({ values });
//     if (values) {
//       onChange(values);
//     }
//   }, [values]);

//   useEffect(() => {
//     if (defaultvalues && defaultvalues.length > 0) {
//       setValues(defaultvalues);
//     }
//   }, [defaultvalues]);

//   return (
//     <div className="mt-3">
//       <Label className="mb-2">{label}</Label>
//       <div className="flex items-center gap-2">
//         {values.map((value, i) => (
//           <Input
//             key={i}
//             value={value}
//             type="number"
//             placeholder="Enter an amount"
//             onChange={(e) => {
//               setValues((state) => {
//                 const newState = state;
//                 newState[i] = newState[i] + e.target.value;
//                 return newState;
//               });
//             }}
//           />
//         ))}
//         <Button
//           type="button"
//           disabled={values.length > 4}
//           onClick={handleAddInput}
//           variant={"outline"}
//         >
//           <GoPlus />
//         </Button>
//       </div>
//     </div>
//   );
// };

export default EwalletsTables;
