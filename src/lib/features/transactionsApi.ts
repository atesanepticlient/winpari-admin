import { apiSlice } from "./apiSlice";

const transactionsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query({
      query: ({ userId, page = 1, limit = 10 }) =>
        `/api/transactions/${userId}?page=${page}&limit=${limit}`,
    }),
  }),
});

export const { useGetTransactionsQuery } = transactionsApiSlice;
