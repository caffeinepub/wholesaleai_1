import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendActor } from './useBackendActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  UserProfile,
  Deal,
  Buyer,
  DealAnalysis,
  ContractDocument,
  AnalyticsData,
  DealStage,
  Variant_Unsigned_Signed,
  Variant_PurchaseContract_AssignmentContract,
  MembershipCatalog,
  MembershipPricing,
  MembershipTier,
  ShoppingItem,
  StripeConfiguration,
  PaymentSession,
  StripeSessionStatus,
} from '../backend';
import { ExternalBlob } from '../backend';
import { Principal } from '@dfinity/principal';
import { isAuthError, isTimeoutError, getUserFriendlyErrorMessage } from '../lib/authErrors';

// Profile fetch timeout in milliseconds
const PROFILE_FETCH_TIMEOUT_MS = 15000; // 15 seconds

// Helper to normalize backend errors
function normalizeError(error: any): Error {
  const message = error?.message || String(error);
  
  if (message.includes('Unauthorized') || message.includes('requires')) {
    return new Error('You do not have permission to access this feature. Please check your membership tier or contact support.');
  }
  
  if (message.includes('not found')) {
    return new Error('The requested resource was not found.');
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return new Error('Network error. Please check your connection and try again.');
  }
  
  return new Error('An unexpected error occurred. Please try again.');
}

// Helper to create a timeout promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

// User Profile - CRITICAL FIX: Use startup-safe backend method
export function useGetCallerUserProfile() {
  const { actor, actorReady, isLoading: actorFetching } = useBackendActor();
  const { identity } = useInternetIdentity();

  // Only fetch profile when authenticated (not anonymous)
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();
  const principalId = identity?.getPrincipal().toString() || 'anonymous';

  const query = useQuery<UserProfile | null>({
    // Include authenticated principal in query key to prevent cross-identity cache bleed
    queryKey: ['currentUserProfile', principalId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        // Use the startup-safe backend method that never traps
        const result = await withTimeout(
          actor.checkCallerUserProfileResult(),
          PROFILE_FETCH_TIMEOUT_MS,
          'Profile loading timed out. Please check your connection and try again.'
        );
        
        // Handle the three possible states
        if (result.__kind__ === 'Anonymous') {
          // User is not authenticated (shouldn't happen due to enabled check, but handle it)
          const authError = new Error('Authentication required. Please sign in.');
          (authError as any).errorType = 'auth';
          throw authError;
        }
        
        if (result.__kind__ === 'FirstTime') {
          // First-time user with no profile - return null to trigger ProfileSetupDialog
          return null;
        }
        
        if (result.__kind__ === 'Saved') {
          // User has a saved profile
          const profile = result.Saved.profile;
          
          // If profile exists but name is empty, treat as needing setup
          if (!profile.name || profile.name.trim() === '') {
            return null;
          }
          
          return profile;
        }
        
        // Should never reach here, but handle it
        return null;
      } catch (error: any) {
        // Preserve the original error for proper classification
        const errorMsg = error?.message || String(error);
        
        // Classify error type for diagnostics
        if (errorMsg.includes('timed out') || errorMsg.includes('timeout')) {
          const timeoutError = new Error('Profile loading timed out. Please check your connection and try again.');
          (timeoutError as any).errorType = 'timeout';
          (timeoutError as any).originalError = errorMsg;
          throw timeoutError;
        }
        
        // Check for auth errors (delegation expired, invalid identity, etc.)
        if (errorMsg.includes('delegation') || errorMsg.includes('expired') || 
            errorMsg.includes('invalid identity') || errorMsg.includes('forbidden')) {
          const authError = new Error('Authentication error. Please sign out and sign in again.');
          (authError as any).errorType = 'auth';
          (authError as any).originalError = errorMsg;
          throw authError;
        }
        
        // Check for network errors
        if (errorMsg.includes('network') || errorMsg.includes('connection') || errorMsg.includes('fetch')) {
          const networkError = new Error('Network error. Please check your connection and try again.');
          (networkError as any).errorType = 'network';
          (networkError as any).originalError = errorMsg;
          throw networkError;
        }
        
        // For other errors, preserve the message and mark as unexpected
        const unexpectedError = new Error(errorMsg || 'An unexpected error occurred. Please try again.');
        (unexpectedError as any).errorType = 'unexpected';
        (unexpectedError as any).originalError = errorMsg;
        throw unexpectedError;
      }
    },
    // Only enable when actor is ready AND user is authenticated
    enabled: actorReady && isAuthenticated,
    retry: (failureCount, error) => {
      // Don't retry on authorization errors or timeouts
      if (isAuthError(error) || isTimeoutError(error)) {
        return false;
      }
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    staleTime: 0, // Always fetch fresh on mount
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Align loading/fetched semantics with authorization component guidance
  // to prevent onboarding modal flash (actor dependency-aware loading/fetched)
  return {
    ...query,
    // Return proper loading state that accounts for actor dependency
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useInitializeProfile() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      return await actor.initializeProfile();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      return await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Admin checks
export function useIsCallerAdmin() {
  const { actor, actorReady } = useBackendActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error: any) {
        return false;
      }
    },
    enabled: actorReady,
  });
}

// Deals
export function useGetDeals() {
  const { actor, actorReady, isLoading: actorLoading } = useBackendActor();

  return useQuery<Deal[]>({
    queryKey: ['deals'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listDeals();
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    enabled: actorReady,
    retry: 1,
  });
}

export function useGetDeal(dealId: bigint | null) {
  const { actor, actorReady } = useBackendActor();

  return useQuery<Deal | null>({
    queryKey: ['deal', dealId?.toString()],
    queryFn: async () => {
      if (!actor || !dealId) return null;
      try {
        return await actor.getDeal(dealId);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    enabled: actorReady && dealId !== null,
  });
}

export function useCreateDeal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sellerName: string;
      sellerPhone: string;
      address: string;
      arv: bigint;
      repairs: bigint;
      askingPrice: bigint;
      yourOffer: bigint;
      notes: string;
      estimatedProfit: bigint;
    }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.createDeal(
          params.sellerName,
          params.sellerPhone,
          params.address,
          params.arv,
          params.repairs,
          params.askingPrice,
          params.yourOffer,
          params.notes,
          params.estimatedProfit
        );
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      dealId: bigint;
      stage: DealStage;
      sellerName: string;
      sellerPhone: string;
      address: string;
      arv: bigint;
      repairs: bigint;
      askingPrice: bigint;
      yourOffer: bigint;
      assignedBuyer: bigint | null;
      contractDeadline: bigint | null;
      notes: string;
      estimatedProfit: bigint;
      actualProfit: bigint | null;
    }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.updateDeal(
          params.dealId,
          params.stage,
          params.sellerName,
          params.sellerPhone,
          params.address,
          params.arv,
          params.repairs,
          params.askingPrice,
          params.yourOffer,
          params.assignedBuyer,
          params.contractDeadline,
          params.notes,
          params.estimatedProfit,
          params.actualProfit
        );
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
    },
  });
}

export function useDeleteDeal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealId: bigint) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.deleteDeal(dealId);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useMoveDealToStage() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { dealId: bigint; newStage: DealStage }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.moveDealToStage(params.dealId, params.newStage);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
    },
  });
}

// Deal Analyzer
export function useAnalyzeDeal() {
  const { actor } = useBackendActor();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.analyzeDeal(address);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
  });
}

export function useCreateDealFromAnalysis() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      analysis: DealAnalysis;
      sellerName: string;
      sellerPhone: string;
    }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.createDealFromAnalysis(
          params.analysis,
          params.sellerName,
          params.sellerPhone
        );
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

// Buyers
export function useGetBuyers() {
  const { actor, actorReady } = useBackendActor();

  return useQuery<Buyer[]>({
    queryKey: ['buyers'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listBuyers();
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    enabled: actorReady,
    retry: 1,
  });
}

export function useGetBuyer(buyerId: bigint | null) {
  const { actor, actorReady } = useBackendActor();

  return useQuery<Buyer | null>({
    queryKey: ['buyer', buyerId?.toString()],
    queryFn: async () => {
      if (!actor || !buyerId) return null;
      try {
        return await actor.getBuyer(buyerId);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    enabled: actorReady && buyerId !== null,
  });
}

export function useCreateBuyer() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      phone: string;
      email: string;
      preferredAreas: string[];
      budgetMin: bigint;
      budgetMax: bigint;
      propertyTypePreference: string;
      notes: string;
    }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.createBuyer(
          params.name,
          params.phone,
          params.email,
          params.preferredAreas,
          params.budgetMin,
          params.budgetMax,
          params.propertyTypePreference,
          params.notes
        );
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    },
  });
}

export function useUpdateBuyer() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      buyerId: bigint;
      name: string;
      phone: string;
      email: string;
      preferredAreas: string[];
      budgetMin: bigint;
      budgetMax: bigint;
      propertyTypePreference: string;
      notes: string;
    }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.updateBuyer(
          params.buyerId,
          params.name,
          params.phone,
          params.email,
          params.preferredAreas,
          params.budgetMin,
          params.budgetMax,
          params.propertyTypePreference,
          params.notes
        );
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      queryClient.invalidateQueries({ queryKey: ['buyer'] });
    },
  });
}

export function useDeleteBuyer() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buyerId: bigint) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.deleteBuyer(buyerId);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    },
  });
}

export function useAssignBuyerToDeal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { dealId: bigint; buyerId: bigint }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.assignBuyerToDeal(params.dealId, params.buyerId);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
    },
  });
}

// Contracts
export function useGetContractsByDeal(dealId: bigint | null) {
  const { actor, actorReady } = useBackendActor();

  return useQuery<ContractDocument[]>({
    queryKey: ['contracts', dealId?.toString()],
    queryFn: async () => {
      if (!actor || !dealId) return [];
      try {
        return await actor.listContractsByDeal(dealId);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    enabled: actorReady && dealId !== null,
    retry: 1,
  });
}

export function useUploadContract() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      dealId: bigint;
      documentType: Variant_PurchaseContract_AssignmentContract;
      fileName: string;
      closingDate: bigint | null;
      emd: bigint | null;
      blob: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.uploadContract(
          params.dealId,
          params.documentType,
          params.fileName,
          params.closingDate,
          params.emd,
          params.blob
        );
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.dealId.toString()] });
    },
  });
}

export function useUpdateContractStatus() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      contractId: bigint;
      signingStatus: Variant_Unsigned_Signed;
      closingDate: bigint | null;
      emd: bigint | null;
    }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.updateContractStatus(
          params.contractId,
          params.signingStatus,
          params.closingDate,
          params.emd
        );
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

// Analytics
export function useGetAnalytics() {
  const { actor, actorReady } = useBackendActor();

  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend not available');
      try {
        return await actor.getAnalytics();
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    enabled: actorReady,
    retry: 1,
  });
}

// Membership
export function useGetMembershipCatalog() {
  const { actor, actorReady } = useBackendActor();

  return useQuery<MembershipCatalog>({
    queryKey: ['membershipCatalog'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend not available');
      try {
        return await actor.getMembershipCatalog();
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    enabled: actorReady,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useUpdateMembershipPricing() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      basic: MembershipPricing;
      pro: MembershipPricing;
      enterprise: MembershipPricing;
    }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.updateMembershipPricing(
          params.basic,
          params.pro,
          params.enterprise
        );
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipCatalog'] });
    },
  });
}

export function useUpdateMembershipTier() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: Principal; tier: MembershipTier }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.updateMembershipTier(params.userId, params.tier);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Stripe
export function useIsStripeConfigured() {
  const { actor, actorReady } = useBackendActor();

  return useQuery<boolean>({
    queryKey: ['isStripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isStripeConfigured();
      } catch (error: any) {
        return false;
      }
    },
    enabled: actorReady,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.setStripeConfiguration(config);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isStripeConfigured'] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useBackendActor();

  return useMutation({
    mutationFn: async (params: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.createCheckoutSession(
          params.items,
          params.successUrl,
          params.cancelUrl
        );
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
  });
}

export function useConfirmMembershipPurchased() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.confirmMembershipPurchased(sessionId);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetStripeSessionStatus() {
  const { actor } = useBackendActor();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      try {
        return await actor.getStripeSessionStatus(sessionId);
      } catch (error: any) {
        throw normalizeError(error);
      }
    },
  });
}
