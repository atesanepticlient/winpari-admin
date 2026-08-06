import { Prisma } from "@prisma/client";
import { apiSlice } from "./apiSlice";
import {
  FetchUserOutput,
  UsersDataOutput,
  UsersFetchInput,
  UserSuspensionInput,
} from "@/types/api";

const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    fetchUsers: builder.query({
      query: ({ page = 1, limit = 10, search = "", status = "all" }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
          status,
        });
        return `/api/users?${params.toString()}`;
      },
      // Ensures Redux invalidates/refetches when filter parameters change
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${JSON.stringify(queryArgs)}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.payload.users.map(({ id }: { id: string }) => ({
                type: "Users" as const,
                id,
              })),
              { type: "Users", id: "LIST" },
            ]
          : [{ type: "Users", id: "LIST" }],
    }),

    fetchUser: builder.query<FetchUserOutput, { id: string }>({
      query: (params) => ({
        method: "GET",
        url: `/api/users/${params.id}`,
      }),
      providesTags: ["user"],
    }),
    fetchAgentUsers: builder.query<
      { users: Prisma.UsersGetPayload<object>[] },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/api/users/agent/${id}`,
      }),
    }),
    userSuspention: builder.mutation<{ success: true }, UserSuspensionInput>({
      query: ({ id, actionType, message }) => ({
        url: `/api/users/${id}/suspension`,
        method: "PUT",
        body: { actionType, message },
      }),
      invalidatesTags: ["user"],
    }),

    createMessage: builder.mutation<
      { success: true },
      { message: string; userId: string }
    >({
      query: (body) => ({
        url: "/api/message",
        method: "POST",
        body,
      }),
      invalidatesTags: ["user"],
    }),

    userRecharge: builder.mutation<
      { success: boolean },
      { message?: string; amount: number; id: string }
    >({
      query: (body) => ({
        url: "/api/recharge/user",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["user"],
    }),
  }),
});

export const {
  useFetchUsersQuery,
  useFetchUserQuery,
  useFetchAgentUsersQuery,
  useUserSuspentionMutation,
  useUserRechargeMutation,
  useCreateMessageMutation,
} = userApiSlice;
