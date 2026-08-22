import { trpc } from '@/lib/trpc';

export function useAuth() {
  const { data: user, isLoading: loading, error, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    logout: () => logoutMutation.mutate(),
  };
}
