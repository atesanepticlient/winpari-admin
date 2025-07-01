import { apiSlice } from "./apiSlice";

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
