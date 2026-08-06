"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, Lock } from "lucide-react";

interface UserItemsCheckProps {
  id: string;
  playerId: string;
  email: string;
  balance: number;
  currencyCode: string;
  batchCurrency: string | null;
  status?: "ACTIVE" | "SUSPENDED" | "VIP";
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const UserItemsCheck = ({
  id,
  playerId,
  email,
  balance,
  currencyCode,
  batchCurrency,
  status = "ACTIVE",
  isSelected,
  onToggle,
}: UserItemsCheckProps) => {
  const isSuspended = status === "SUSPENDED";

  // Disable user if a batch currency is already locked and doesn't match this user's currency
  const isCurrencyMismatched = Boolean(
    batchCurrency && batchCurrency !== currencyCode,
  );
  const isDisabled = isSuspended || isCurrencyMismatched;

  return (
    <tr
      onClick={() => !isDisabled && onToggle(id)}
      className={cn(
        "group border-b border-border/60 transition-colors text-xs select-none",
        isDisabled
          ? "opacity-40 bg-muted/20 cursor-not-allowed"
          : "cursor-pointer hover:bg-muted/40",
        isSelected && "bg-primary/10 hover:bg-primary/15 font-medium",
      )}
    >
      <td className="p-3 w-10 text-center">
        <Checkbox
          checked={isSelected}
          disabled={isDisabled}
          onCheckedChange={() => onToggle(id)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      <td className="p-3 font-mono font-bold text-foreground">
        <div className="flex items-center gap-1.5">
          {playerId}
          {status === "VIP" && (
            <Badge className="bg-amber-500/10 text-amber-500 text-[10px] px-1 py-0 border-amber-500/20">
              VIP
            </Badge>
          )}
        </div>
      </td>

      <td className="p-3 text-muted-foreground truncate max-w-[160px]">
        {email}
      </td>

      <td className="p-3 text-center">
        {isCurrencyMismatched ? (
          <span className="inline-flex items-center gap-1 text-amber-500 text-[10px] font-mono">
            <Lock className="w-3 h-3" /> Mismatch ({currencyCode})
          </span>
        ) : isSuspended ? (
          <span className="inline-flex items-center gap-1 text-destructive text-[11px] font-medium">
            <ShieldAlert className="w-3 h-3" /> Locked
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-emerald-500 text-[11px] font-medium">
            <ShieldCheck className="w-3 h-3" /> Active
          </span>
        )}
      </td>

      {/* Dynamic Currency Code + Balance */}
      <td className="p-3 text-right font-mono font-bold">
        <span className="text-muted-foreground mr-1 text-[10px]">
          {currencyCode}
        </span>
        <span className="text-emerald-400">
          {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </td>
    </tr>
  );
};

export default UserItemsCheck;
