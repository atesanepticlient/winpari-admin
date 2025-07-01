"use client";
import { useFetchAgentUsersQuery } from "@/lib/features/userApiSlice";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { TableSkeletonLoader } from "@/components/loader/table-loader";
const UsersList = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => {
  const { data, isLoading } = useFetchAgentUsersQuery({ id });
  const users = data?.users;
  return (
    <div>
      <Dialog>
        <DialogTrigger>{children}</DialogTrigger>
        <DialogContent className="!max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Users</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overscroll-y-auto">
            {isLoading && <TableSkeletonLoader />}
            {users && (
              <div>
                <div className="overflow-x-auto border rounded-md">
                  <Table className="  ">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player ID</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>

                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user.id} className="">
                          <TableCell>{user.playerId}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {moment(user.createdAt).calendar()}
                          </TableCell>
                          <TableCell>
                            {/* {renderStatusBadge(user.isBanned)} */}
                          </TableCell>

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
                      ))}
                      {users?.length === 0 && (
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
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersList;
