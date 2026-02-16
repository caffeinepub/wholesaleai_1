import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
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
} from '../backend';
import { ExternalBlob } from '../backend';

// User Profile
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Deals
export function useGetDeals() {
  const { actor, isFetching } = useActor();

  return useQuery<Deal[]>({
    queryKey: ['deals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDeals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDeal(dealId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Deal | null>({
    queryKey: ['deal', dealId?.toString()],
    queryFn: async () => {
      if (!actor || !dealId) return null;
      return actor.getDeal(dealId);
    },
    enabled: !!actor && !isFetching && dealId !== null,
  });
}

export function useCreateDeal() {
  const { actor } = useActor();
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
      if (!actor) throw new Error('Actor not available');
      return actor.createDeal(
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeal() {
  const { actor } = useActor();
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
      if (!actor) throw new Error('Actor not available');
      return actor.updateDeal(
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
    },
  });
}

export function useDeleteDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteDeal(dealId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useMoveDealToStage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { dealId: bigint; newStage: DealStage }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.moveDealToStage(params.dealId, params.newStage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
    },
  });
}

// Deal Analyzer
export function useAnalyzeDeal() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.analyzeDeal(address);
    },
  });
}

export function useCreateDealFromAnalysis() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      analysis: DealAnalysis;
      sellerName: string;
      sellerPhone: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createDealFromAnalysis(
        params.analysis,
        params.sellerName,
        params.sellerPhone
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

// Buyers
export function useGetBuyers() {
  const { actor, isFetching } = useActor();

  return useQuery<Buyer[]>({
    queryKey: ['buyers'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listBuyers();
      } catch (error) {
        console.error('Failed to fetch buyers:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBuyer(buyerId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Buyer | null>({
    queryKey: ['buyer', buyerId?.toString()],
    queryFn: async () => {
      if (!actor || !buyerId) return null;
      return actor.getBuyer(buyerId);
    },
    enabled: !!actor && !isFetching && buyerId !== null,
  });
}

export function useCreateBuyer() {
  const { actor } = useActor();
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
      if (!actor) throw new Error('Actor not available');
      return actor.createBuyer(
        params.name,
        params.phone,
        params.email,
        params.preferredAreas,
        params.budgetMin,
        params.budgetMax,
        params.propertyTypePreference,
        params.notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    },
  });
}

export function useUpdateBuyer() {
  const { actor } = useActor();
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
      if (!actor) throw new Error('Actor not available');
      return actor.updateBuyer(
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
      queryClient.invalidateQueries({ queryKey: ['buyer'] });
    },
  });
}

export function useDeleteBuyer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buyerId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBuyer(buyerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    },
  });
}

export function useAssignBuyerToDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { dealId: bigint; buyerId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignBuyerToDeal(params.dealId, params.buyerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
    },
  });
}

// Contracts
export function useGetContractsByDeal(dealId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ContractDocument[]>({
    queryKey: ['contracts', dealId?.toString()],
    queryFn: async () => {
      if (!actor || !dealId) return [];
      try {
        return await actor.listContractsByDeal(dealId);
      } catch (error) {
        console.error('Failed to fetch contracts:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && dealId !== null,
  });
}

export function useUploadContract() {
  const { actor } = useActor();
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
      if (!actor) throw new Error('Actor not available');
      return actor.uploadContract(
        params.dealId,
        params.documentType,
        params.fileName,
        params.closingDate,
        params.emd,
        params.blob
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.dealId.toString()] });
    },
  });
}

export function useUpdateContractStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      contractId: bigint;
      signingStatus: Variant_Unsigned_Signed;
      closingDate: bigint | null;
      emd: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateContractStatus(
        params.contractId,
        params.signingStatus,
        params.closingDate,
        params.emd
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

// Analytics
export function useGetAnalytics() {
  const { actor, isFetching } = useActor();

  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getAnalytics();
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

