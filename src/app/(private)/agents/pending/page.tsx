// app/pending-agents/page.tsx
"use client";

import {
  useGetPendingAgentsQuery,
  useVerifyAgentMutation,
} from "@/lib/features/agentApiSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {  useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export default function PendingAgentsPage() {
  const { data: agents, isLoading, isError } = useGetPendingAgentsQuery({});
  const [verifyAgent] = useVerifyAgentMutation();
  const [selectedAgent, setSelectedAgent] = useState<{
    id: string;
    documents: any;
    fullName: string;
  } | null>(null);

  const handleVerify = async (id: string, action: "approve" | "reject") => {
    try {
      await verifyAgent({ id, action }).unwrap();
      toast.success(`Agent ${action}d successfully`);
      setSelectedAgent(null);
    } catch {
      toast.error(`Failed to ${action} agent`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[180px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-[150px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500">Error loading pending agents</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pending Agent Approvals</h1>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No pending agents for approval
                </TableCell>
              </TableRow>
            ) : (
              agents?.map((agent: any) => (
                <TableRow key={agent.id}>
                  <TableCell>{agent.fullName}</TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>{agent.phone}</TableCell>
                  <TableCell>
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setSelectedAgent({
                            id: agent.id,
                            documents: agent.documents,
                            fullName: agent.fullName,
                          })
                        }
                      >
                        View Documents
                      </Button>
                      <Button
                        variant="success"
                        onClick={() => handleVerify(agent.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleVerify(agent.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Document Modal */}
      <Dialog
        open={!!selectedAgent}
        onOpenChange={(open) => !open && setSelectedAgent(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAgent?.fullName}&apos;s Verification Documents
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video  overflow-hidden">
            {selectedAgent?.documents && (
              <div className="h-[400px] overflow-y-scroll">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex-1 ">
                    <img
                      src={JSON.parse(selectedAgent?.documents).nidFront}
                      alt="NID Front Side"
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 ">
                    <img
                      src={JSON.parse(selectedAgent?.documents).nidBack}
                      alt="NID Back Side"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="mt-8 pb-8">
                  <h3>Verify The agent</h3>
                  <video height="100" controls>
                    <source
                      src={JSON.parse(selectedAgent.documents).faceVideo}
                    />
                  </video>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="success"
              onClick={() =>
                selectedAgent && handleVerify(selectedAgent.id, "approve")
              }
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedAgent && handleVerify(selectedAgent.id, "reject")
              }
            >
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
