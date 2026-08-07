import { apiSlice } from "./apiSlice";
import {
  DepositsOutput,
  DepostisFetchInput,
  PaymentDataOutput,
  WithdrawsFetchInput,
  WithdrawsOutput,
} from "@/types/api";

const agentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    fetchPaymentMethos: builder.query<PaymentDataOutput, void>({
      query: () => ({
        method: "GET",
        url: "/api/payment/methods",
      }),
      providesTags: ["payment"],
    }),
    createPaymentMethod: builder.mutation({
      query: (body) => ({
        url: "/api/payment/methods",
        method: "POST",
        body,
      }),
      invalidatesTags: ["payment"],
    }),
    updatePaymentMethod: builder.mutation({
      query: ({ id, body }) => ({
        url: `/api/payment/methods/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["payment"],
    }),

    deletePaymentMethod: builder.mutation({
      query: ({ id }) => ({
        url: `/api/payment/methods/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["payment"],
    }),

    fetchDeposits: builder.query<DepositsOutput, DepostisFetchInput>({
      query: (params) => ({
        url: `/api/payment/deposits?search=${params.search}&from=${params.from}&to=${params.to}&gateway=${params.gateway}&minAmount=${params.minAmount}&maxAmount=${params.maxAmount}&status=${params.status}&limit=${params.limit}&page=${params.page}`,
        //                                                                                                                                      ↑ FIXED: Changed ? to &
        method: "GET",
      }),
      providesTags: ["deposit"],
    }),

    fetchWithdraws: builder.query<WithdrawsOutput, WithdrawsFetchInput>({
      query: (params) => ({
        url: `/api/payment/withdraws?search=${params.search}&from=${params.from}&to=${params.to}&card=${params.card}&minAmount=${params.minAmount}&maxAmount=${params.maxAmount}&status=${params.status}&limit=${params.limit}&page=${params.page}`,
        //                                                                                                                                    ↑ FIXED: Changed ? to &
        method: "GET",
      }),
      providesTags: ["withdraw"],
    }),

    updateDeposit: builder.mutation<
      { message: string },
      { change: "accept" | "reject"; id: string; message?: string }
    >({
      query: ({ change, id, message }) => ({
        method: "PUT",
        url: `/api/payment/deposits/${id}?change=${change}`,
        body: { message },
      }),
      invalidatesTags: ["deposit"],
    }),

    updateWithdraw: builder.mutation<
      { message: string },
      { change: "accept" | "reject"; id: string; message?: string }
    >({
      query: ({ change, id, message }) => ({
        method: "PUT",
        url: `/api/payment/withdraws/${id}?change=${change}`,
        body: { message },
      }),
      invalidatesTags: ["withdraw"],
    }),

    deleteDeposit: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/api/payment/deposits/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["deposit"],
    }),

    deleteWithdraw: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/api/payment/withdraws/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["withdraw"],
    }),
  }),
});

export const {
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
  useFetchPaymentMethosQuery,
  useFetchDepositsQuery,
  useFetchWithdrawsQuery,
  useUpdateDepositMutation,
  useUpdateWithdrawMutation,
  useDeleteDepositMutation,
  useDeleteWithdrawMutation,
} = agentApiSlice;
