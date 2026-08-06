import React from "react";
import Details from "./details";

type Params = Promise<{ id: string }>;

const UserProfile = async ({ params }: { params: Params }) => {
  const { id } = await params;
  return (
    <div className="p-6 bg-[#080d1a] min-h-screen text-slate-100">
      <Details id={id} />
    </div>
  );
};

export default UserProfile;
