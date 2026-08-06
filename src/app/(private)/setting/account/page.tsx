"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { logout } from "@/action/logout";
import { nameChange } from "@/action/account";
import {
  updateIpWhitelist,
  resetTwoFactorSecret,
  getAdminOverviewData,
} from "@/action/account";
import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Globe,
  Plus,
  Trash2,
  User,
  Mail,
  Lock,
  LogOut,
  Check,
  Pen,
  X,
  Wallet,
  Users,
  Shield,
  Clock,
  Laptop,
} from "lucide-react";

export default function AccountPage() {
  const [pending, startTransition] = useTransition();

  // State from Database
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [teamAdmins, setTeamAdmins] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalEWallets: 0,
  });

  // Name Edit State
  const [nameEditable, setNameEditable] = useState(false);
  const [name, setName] = useState("");

  // IP Whitelist State
  const [ipList, setIpList] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");

  // System session info
  const [sessionInfo, setSessionInfo] = useState({ browser: "", os: "" });

  // Load Database Data
  const loadData = () => {
    setLoading(true);
    getAdminOverviewData().then((res) => {
      if (res.success && res.data) {
        setAdminData(res.data.admin);
        setTeamAdmins(res.data.teamAdmins);
        setStats(res.data.stats);
        setName(res.data.admin?.fullName || "");
        setIpList(res.data.admin?.ipWhitelist || []);
      } else {
        toast.error("Failed to load admin details");
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();

    // Client environment detection
    const ua = navigator.userAgent;
    let b = "Unknown",
      o = "Unknown";

    if (ua.includes("Chrome")) b = "Chrome";
    else if (ua.includes("Firefox")) b = "Firefox";
    else if (ua.includes("Safari")) b = "Safari";
    else if (ua.includes("Edge")) b = "Edge";

    if (ua.includes("Windows")) o = "Windows";
    else if (ua.includes("Mac")) o = "macOS";
    else if (ua.includes("Linux")) o = "Linux";
    else if (ua.includes("Android")) o = "Android";
    else if (ua.includes("iPhone")) o = "iOS";

    setSessionInfo({ browser: b, os: o });
  }, []);

  // Handlers
  const handleNameSave = () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    startTransition(() => {
      nameChange({ name }).then((res) => {
        if (res.success) {
          toast.success("Name updated successfully");
          setNameEditable(false);
          loadData();
        } else {
          toast.error(res.error || "Failed to update name");
        }
      });
    });
  };

  const handleAddIp = () => {
    const trimmed = newIp.trim();
    if (!trimmed) return;
    if (ipList.includes(trimmed)) return toast.error("IP already added");
    const updated = [...ipList, trimmed];
    setIpList(updated);
    setNewIp("");
    saveIpList(updated);
  };

  const handleRemoveIp = (ipToRemove: string) => {
    const updated = ipList.filter((ip) => ip !== ipToRemove);
    setIpList(updated);
    saveIpList(updated);
  };

  const saveIpList = (newList: string[]) => {
    startTransition(() => {
      updateIpWhitelist(newList).then((res) => {
        if (res.success) toast.success(res.success);
        else if (res.error) toast.error(res.error);
      });
    });
  };

  const handleReset2FA = () => {
    if (
      confirm(
        "Are you sure you want to reset your 2FA? You will need to scan a new QR code on your next login.",
      )
    ) {
      startTransition(() => {
        resetTwoFactorSecret().then((res) => {
          if (res.success) {
            toast.success(res.success);
            loadData();
          } else {
            toast.error(res.error);
          }
        });
      });
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      startTransition(() => {
        logout().then((res) => {
          if (res.success) location.reload();
          else if (res.error) toast.error(res.error);
        });
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Account & Security Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your administrator profile, security preferences, and system
            access.
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="destructive"
          disabled={pending}
          className="w-fit"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>

      <Separator />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security & 2FA</TabsTrigger>
              <TabsTrigger value="team">Admin Team</TabsTrigger>
            </TabsList>

            {/* TAB 1: Profile Information */}
            <TabsContent value="profile" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Details</CardTitle>
                  <CardDescription>
                    Update your display name and view account metadata.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                      <AvatarImage src="" alt={adminData?.fullName} />
                      <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                        {adminData?.fullName
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase() || "AD"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 w-full space-y-4">
                      {/* Name Editing */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Full Name
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() => setNameEditable(!nameEditable)}
                            className="h-7 w-7 p-0"
                          >
                            {nameEditable ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Pen className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {nameEditable ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Enter full name"
                            />
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={handleNameSave}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-base font-medium">
                            {adminData?.fullName}
                          </p>
                        )}
                      </div>

                      {/* Emails */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Primary Email
                          </label>
                          <p className="text-sm font-medium">
                            {adminData?.email}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase text-muted-foreground">
                            2FA / Security Email
                          </label>
                          <p className="text-sm font-medium">
                            {adminData?.twoFAEmail || adminData?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Connected Admin E-Wallets */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" /> Managed
                      E-Wallets
                    </h3>
                    {adminData?.eWallet && adminData.eWallet.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {adminData.eWallet.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                          >
                            <span className="text-sm font-medium">
                              {item.eWallet?.walletName || "Custom Wallet"}
                            </span>
                            <Badge
                              variant={item.isActive ? "default" : "secondary"}
                            >
                              {item.isActive ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No specific admin payment wallets assigned to your
                        profile.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Security & 2FA */}
            <TabsContent value="security" className="mt-4 space-y-4">
              {/* 2FA Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-primary" /> Two-Factor
                      Authentication
                    </span>
                    {adminData?.twoFactorSecret ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Configured
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Not
                        Configured
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Protects your admin account using Google Authenticator or
                    any TOTP app.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your account is enforced with standard 6-digit TOTP
                    verification on every login.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset2FA}
                      disabled={pending || !adminData?.twoFactorSecret}
                    >
                      Reset 2FA QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* IP Whitelist Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" /> IP Address
                    Whitelist
                  </CardTitle>
                  <CardDescription>
                    Restrict login access strictly to trusted IP addresses. If
                    empty, access is allowed from any IP.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="e.g. 192.168.1.1 or 103.21.12.4"
                      value={newIp}
                      onChange={(e) => setNewIp(e.target.value)}
                    />
                    <Button onClick={handleAddIp} disabled={pending}>
                      <Plus className="h-4 w-4 mr-1" /> Add IP
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {ipList.length === 0 ? (
                      <div className="p-3 text-center rounded-lg border border-dashed text-xs text-muted-foreground">
                        No IP restrictions active. Admin can log in from any IP
                        address.
                      </div>
                    ) : (
                      ipList.map((ip) => (
                        <div
                          key={ip}
                          className="flex items-center justify-between p-2.5 rounded-md border bg-muted/30 text-sm font-mono"
                        >
                          <span>{ip}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() => handleRemoveIp(ip)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Security Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Link href="/setting/password">
                    <Button variant="outline" size="sm">
                      <Lock className="mr-2 h-4 w-4" /> Change Password
                    </Button>
                  </Link>
                  <Link href="/setting/email">
                    <Button variant="outline" size="sm">
                      <Mail className="mr-2 h-4 w-4" /> Change Email
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Admin Team */}
            <TabsContent value="team" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Registered System
                    Administrators
                  </CardTitle>
                  <CardDescription>
                    All admin accounts with system access privileges.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {teamAdmins.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs bg-muted">
                              {item.fullName
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {item.fullName}{" "}
                              {item.id === adminData?.id && (
                                <span className="text-xs text-muted-foreground">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.twoFactorSecret ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-emerald-500/50 text-emerald-600"
                            >
                              2FA Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              2FA Unset
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - System Summary & Session Info */}
        <div className="space-y-6">
          {/* System Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <span className="text-sm text-muted-foreground">
                  Total Users
                </span>
                <span className="text-base font-bold">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <span className="text-sm text-muted-foreground">
                  Active Agents
                </span>
                <span className="text-base font-bold">{stats.totalAgents}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <span className="text-sm text-muted-foreground">
                  Supported Wallets
                </span>
                <span className="text-base font-bold">
                  {stats.totalEWallets}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Active Session Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Laptop className="h-4 w-4 text-primary" /> Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Operating System</span>
                <span className="font-medium">{sessionInfo.os}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Browser</span>
                <span className="font-medium">{sessionInfo.browser}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account Created</span>
                <span className="font-medium">
                  {adminData?.createdAt
                    ? new Date(adminData.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )
                    : "N/A"}
                </span>
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Admin Session
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
