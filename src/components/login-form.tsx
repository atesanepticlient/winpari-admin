"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useForm } from "react-hook-form";
import zod from "zod";
import { loginSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormLabel,
  FormItem,
  FormMessage,
  FormField,
  FormDescription,
} from "@/components/ui/form";
import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createVerification, verifyAdmin } from "@/action/login";
import { redirect } from "next/navigation";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [pending, startTransition] = useTransition();
  const [hasTokenSent, setTokenSent] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<zod.infer<typeof loginSchema>>({
    defaultValues: {
      email: "",
      password: "",
      token: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const handleCreateVerification = (data: zod.infer<typeof loginSchema>) => {
    startTransition(() => {
      createVerification(data).then((res) => {
        if (res.success) {
          if (res.qrCode) setQrCode(res.qrCode);
          setTokenSent(true);
        } else if (res.error) {
          toast.error(res.error);
        }
      });
    });
  };

  const handleVerify = (data: zod.infer<typeof loginSchema>) => {
    startTransition(() => {
      verifyAdmin(data).then((res) => {
        if (res.success) {
          toast.success(res.success);
          location.reload();
          redirect("/dashboard");
        } else if (res.error) {
          toast.error(res.error);
        }
      });
    });
  };

  return (
    <div
      className={cn("flex flex-col gap-6 w-full max-w-sm mx-auto", className)}
      {...props}
    >
      <Card className="border-muted-foreground/10 shadow-lg shadow-black/5">
        <CardHeader className="space-y-3 pb-2">
          <div className="flex items-center justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              {hasTokenSent ? (
                <ShieldCheck className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-xl font-semibold tracking-tight">
              {hasTokenSent ? "Two-factor verification" : "Admin sign in"}
            </CardTitle>
            <CardDescription className="text-sm">
              {hasTokenSent
                ? qrCode
                  ? "Scan the QR code, then enter the 6-digit code"
                  : "Enter the code from your authenticator app"
                : "Sign in with your admin credentials"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {!hasTokenSent ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateVerification)}>
                <div className="flex flex-col gap-5">
                  <FormField
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel className="text-sm font-medium">
                          Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              disabled={pending}
                              id="email"
                              type="email"
                              placeholder="you@company.com"
                              autoComplete="email"
                              required
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="password"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <div className="flex items-center">
                          <FormLabel className="text-sm font-medium">
                            Password
                          </FormLabel>
                          <Link
                            href="#"
                            className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              disabled={pending}
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              required
                              className="pl-9 pr-9"
                              {...field}
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowPassword((s) => !s)}
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

                  <Button type="submit" disabled={pending} className="w-full">
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {pending ? "Signing in…" : "Sign in"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleVerify)}>
                <div className="flex flex-col gap-5">
                  {qrCode && (
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 p-4">
                      <img
                        src={qrCode}
                        alt="Scan with Google Authenticator"
                        className="h-36 w-36 rounded-md bg-white p-2 shadow-sm"
                      />
                      <p className="text-center text-xs text-muted-foreground leading-relaxed">
                        Open Google Authenticator, scan this code, then enter
                        the 6-digit number it shows below.
                      </p>
                    </div>
                  )}

                  <FormField
                    name="token"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel className="text-sm font-medium">
                          Authentication code
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              disabled={pending}
                              id="token"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              autoComplete="one-time-code"
                              placeholder="123456"
                              required
                              className="pl-9 text-center tracking-[0.5em] font-mono"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <FormDescription className="text-xs">
                          Enter the current code from your authenticator app.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-2">
                    <Button disabled={pending} type="submit" className="w-full">
                      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {pending ? "Verifying…" : "Verify and sign in"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Protected by IP restrictions and two-factor authentication.
      </p>
    </div>
  );
}
