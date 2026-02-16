import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendActor } from './useBackendActor';
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

// User Profile
export function useGetCallerUserProfile() {
  const { actor, actorReady } = useBackendActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        // Wrap the backend call with a hard timeout
        const profile = await withTimeout(
          actor.getCallerUserProfile(),
          PROFILE_FETCH_TIMEOUT_MS,
          'Profile loading timed out. Please check your connection and try again.'
        );
        
        // If profile exists but name is empty, treat as needing setup
        if (profile && (!profile.name || profile.name.trim() === '')) {
          return null;
        }
        
        return profile;
      } catch (error: any) {
        // Re-throw with clear error message
        const errorMsg = error?.message || String(error);
        
        if (errorMsg.includes('timed out') || errorMsg.includes('timeout')) {
          throw new Error('Profile loading timed out. Please check your connection and try again.');
        }
        
        if (errorMsg.includes('Unauthorized') || errorMsg.includes('Authentication required')) {
          throw new Error('Authentication required. Please sign in again.');
        }
        
        throw new Error('Failed to load profile. Please try again.');
      }
    },
    enabled: actorReady,
    retry: (failureCount, error) => {
      // Don't retry on authorization errors or timeouts
      const errorMsg = error?.message || '';
      if (errorMsg.includes('Unauthorized') || 
          errorMsg.includes('Authentication required') ||
          errorMsg.includes('timed out')) {
        return false;
      }
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    staleTime: 0, // Always fetch fresh on mount
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  return query;
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
      dealId: bigint;
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.dealId.toString()] });
    },
  });
}

// Analytics
export function useGetAnalytics() {
  const { actor, actorReady } = useBackendActor();

  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
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
      if (!actor) throw new Error('Actor not available');
      return await actor.getMembershipCatalog();
    },
    enabled: actorReady,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      return await actor.updateMembershipPricing(params.basic, params.pro, params.enterprise);
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
      return await actor.updateMembershipTier(params.userId, params.tier);
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
      return await actor.isStripeConfigured();
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
      return await actor.setStripeConfiguration(config);
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
      const result = await actor.createCheckoutSession(
        params.items,
        params.successUrl,
        params.cancelUrl
      );
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
  });
}

export function useConfirmMembershipPurchased() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Backend not available. Please refresh the page.');
      return await actor.confirmMembershipPurchased(sessionId);
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
      return await actor.getStripeSessionStatus(sessionId);
    },
  });
}

export function useGetPaymentSession(sessionId: string | null) {
  const { actor, actorReady } = useBackendActor();

  return useQuery<PaymentSession | null>({
    queryKey: ['paymentSession', sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) return null;
      return await actor.getPaymentSession(sessionId);
    },
    enabled: actorReady && sessionId !== null,
  });
}
