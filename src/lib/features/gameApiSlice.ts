import { Prisma } from "@prisma/client";
import { apiSlice } from "./apiSlice";
import { AgentsUpdateInput } from "@/types/api";

const gameApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    loginApi: builder.mutation({
      query: () => ({
        url: "api/login-api",
        method: "POST",
        body: {},
      }),
    }),
  }),
});

export const { useLoginApiMutation } = gameApiSlice;
