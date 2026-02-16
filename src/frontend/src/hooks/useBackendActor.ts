import { useInternetIdentity } from './useInternetIdentity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';

const ACTOR_QUERY_KEY = 'backend-actor';

export function useBackendActor() {
  const { identity, isInitializing: identityInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity
        }
      };

      const actor = await createActorWithConfig(actorOptions);
      
      // Only initialize access control if admin token is present
      const adminToken = getSecretParameter('caffeineAdminToken');
      if (adminToken && adminToken.trim() !== '') {
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (error) {
          console.warn('Admin initialization failed (non-critical):', error);
          // Continue anyway - user can still use the app without admin privileges
        }
      }
      
      return actor;
    },
    staleTime: Infinity,
    enabled: !identityInitializing,
    retry: 2,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        }
      });
    }
  }, [actorQuery.data, queryClient]);

  // Compute readiness states
  const isLoading = identityInitializing || actorQuery.isLoading;
  const actorReady = !identityInitializing && !!actorQuery.data && !actorQuery.isLoading;

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
    isLoading,
    actorReady,
    isError: actorQuery.isError,
    error: actorQuery.error,
    refetch: actorQuery.refetch,
  };
}
