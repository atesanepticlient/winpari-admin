/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import moment from "moment";
import CookieLoader from "@/components/loader/cooki-loader";
import Link from "next/link";
import { useFetchUsersQuery } from "@/lib/features/userApiSlice";

const Users: React.FC = () => {
  const [filter, setFilter] = useState({
    limit: 10,
    search: "",
    status: "all",
    page: 1,
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filter.search);

  // Debounce search input to prevent rapid unwanted API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [debouncedSearch]);

  const { data, isLoading, isFetching } = useFetchUsersQuery(filter);

  const users = data?.payload?.users || [];
  const totalFound = data?.payload?.total || 0;

  const totalPages = Math.max(1, Math.ceil(totalFound / filter.limit));
  const hasNextPage = filter.page < totalPages;
  const hasPrevPage = filter.page > 1;

  const handleStatusChange = (val: string) => {
    setFilter((prev) => ({
      ...prev,
      status: val,
      page: 1, // Reset to page 1 on filter change
    }));
  };

  const renderStatusBadge = (isBanned: boolean) => {
    if (isBanned) {
      return <Badge className="bg-red-500 hover:bg-red-600">Banned</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="shadow rounded-lg overflow-hidden ">
        {/* Filters */}
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">
                Search
              </Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <Input
                  id="search"
                  type="text"
                  placeholder="Phone, Player ID, Email..."
                  className="pl-10"
                  value={debouncedSearch}
                  onChange={(e) => setDebouncedSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Status
              </Label>
              <Select value={filter.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="status-filter" className="mt-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unbanned">Active</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex w-full h-64 justify-center items-center">
            <CookieLoader />
          </div>
        ) : (
          <>
            <div
              className={`overflow-x-auto border-b ${isFetching ? "opacity-50" : "opacity-100"} transition-opacity`}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Bet</TableHead>
                    <TableHead>Total Win Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => {
                    // Pull precalculated totals from API payload
                    const grandTotalBet =
                      user.calculatedStats?.grandTotalBet ?? 0;
                    const winRate = user.calculatedStats?.winRate ?? "0.00";

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.playerId || "N/A"}
                        </TableCell>
                        <TableCell>{user.phone || "N/A"}</TableCell>
                        <TableCell>{user.email || "N/A"}</TableCell>
                        <TableCell>
                          {user.createdAt
                            ? moment(user.createdAt).calendar()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(user.isBanned)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ৳{Number(grandTotalBet).toLocaleString()}
                        </TableCell>
                        <TableCell>{winRate}%</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/users/explor/${user.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="!rounded-button whitespace-nowrap cursor-pointer"
                            >
                              <i className="fas fa-eye mr-1"></i> View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {users.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-gray-500"
                      >
                        No users found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{users.length}</span> of{" "}
                <span className="font-medium">{totalFound}</span> users (Page{" "}
                {filter.page} of {totalPages})
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrevPage || isFetching}
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  className="!rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i className="fas fa-chevron-left mr-1"></i> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNextPage || isFetching}
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="!rounded-button whitespace-nowrap cursor-pointer"
                >
                  Next <i className="fas fa-chevron-right ml-1"></i>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Users;
