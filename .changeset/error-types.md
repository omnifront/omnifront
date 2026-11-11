---
"@omnifront/query": minor
"@omnifront/query-infinite": minor
"@omnifront/react": minor
"@omnifront/vue": minor
"@omnifront/angular": minor
---

Typed errors, in the same position as TanStack Query. `error` is now `TError | undefined` with `TError` defaulting to `Error` (it was `unknown`); set another default for the whole app by augmenting `Register` (`defaultError`).

**Breaking (types only):** the error type is the second type argument everywhere, so explicit type arguments shift: `Mutation<TData, TVariables, TContext>` is now `Mutation<TData, TError, TVariables, TContext>` (the same for `MutationOptions`, `MutationState`, `useMutation`, `injectMutation` and their result types), and `InfiniteQueryObserver<TPage, TPageParam>` is now `InfiniteQueryObserver<TPage, TError, TPageParam>` (the same for its options, result and the infinite hooks). Code that lets the types be inferred needs no change. `api.mutationOptions<TData, TVariables>` is unchanged.
