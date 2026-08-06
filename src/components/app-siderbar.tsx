"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { CircleDollarSign, LayoutDashboard } from "lucide-react";
import {
  MdOutlineSupportAgent,
  MdBusinessCenter,
  MdOutlineAccountBalanceWallet,
} from "react-icons/md";
import { FaUsers } from "react-icons/fa6";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { FaGear } from "react-icons/fa6";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";

import useCurrentUser from "@/hooks/useCurrentUser";

const rawNavMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Payment",
    url: "#",
    icon: CircleDollarSign,
    items: [
      {
        title: "Deposit",
        url: "/payment/deposits",
      },
      {
        title: "Withdraws",
        url: "/payment/withdraws",
      },
      {
        title: "Add Banking",
        url: "/payment/banking",
      },
    ],
  },
  {
    title: "Agent",
    url: "#",
    icon: MdOutlineSupportAgent,
    items: [
      {
        title: "Explore",
        url: "/agents/explor",
      },
      {
        title: "Pending",
        url: "/agents/pending",
      },
      {
        title: "Payouts",
        url: "/agents/payouts",
      },
    ],
  },
  {
    title: "Users",
    url: "#",
    icon: FaUsers,
    items: [
      {
        title: "Explore",
        url: "/users/explor",
      },
    ],
  },
  {
    title: "Site Center",
    url: "#",
    icon: MdBusinessCenter,
    items: [
      {
        title: "Contact",
        url: "/contact",
      },
      {
        title: "Setting",
        url: "/site",
      },
    ],
  },
  {
    title: "Recharge",
    url: "#",
    icon: MdOutlineAccountBalanceWallet,
    items: [
      {
        title: "Users",
        url: "/recharge/users",
      },
    ],
  },
  {
    title: "Setting",
    url: "#",
    icon: FaGear,
    items: [
      {
        title: "Account",
        url: "/setting/account",
      },
      {
        title: "Email",
        url: "/setting/email",
      },
      {
        title: "Password",
        url: "/setting/password",
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const admin = useCurrentUser();
  const pathname = usePathname();

  const navMainWithActiveState = React.useMemo(() => {
    return rawNavMain.map((item) => {
      // Check if sub-item matches path
      const isSubItemActive = item.items?.some(
        (subItem) =>
          pathname === subItem.url || pathname.startsWith(`${subItem.url}/`),
      );

      // Check if direct top-level link matches path (e.g. /dashboard)
      const isMainActive =
        item.url !== "#" &&
        (pathname === item.url || pathname.startsWith(`${item.url}/`));

      return {
        ...item,
        isActive: isMainActive || isSubItemActive,
      };
    });
  }, [pathname]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={navMainWithActiveState} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: admin?.fullName ?? "Admin",
            email: admin?.email ?? "",
            avatar: "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
