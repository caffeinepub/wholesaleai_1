import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  // Types from original actor state
  public type OldMembershipTier = {
    #Basic;
    #Pro;
    #Enterprise;
  };

  public type OldUserProfile = {
    name : Text;
    phone : Text;
    email : Text;
    membershipTier : OldMembershipTier;
  };

  public type OldDeal = {
    id : Nat;
    owner : Principal;
    stage : {
      #NewLead;
      #ContactedSeller;
      #Negotiating;
      #UnderContract;
      #Assigned;
      #Closed;
    };
    sellerName : Text;
    sellerPhone : Text;
    address : Text;
    arv : Nat;
    repairs : Nat;
    askingPrice : Nat;
    yourOffer : Nat;
    assignedBuyer : ?Nat;
    contractDeadline : ?Int;
    notes : Text;
    estimatedProfit : Nat;
    actualProfit : ?Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  public type OldContractDocument = {
    id : Nat;
    owner : Principal;
    dealId : Nat;
    documentType : { #PurchaseContract; #AssignmentContract };
    fileName : Text;
    uploadedAt : Int;
    signingStatus : { #Unsigned; #Signed };
    closingDate : ?Int;
    emd : ?Nat;
    blob : Storage.ExternalBlob;
  };

  public type OldActor = {
    nextDealId : Nat;
    nextBuyerId : Nat;
    nextContractId : Nat;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    deals : Map.Map<Nat, OldDeal>;
    buyers : Map.Map<Nat, {
      id : Nat;
      owner : Principal;
      name : Text;
      phone : Text;
      email : Text;
      preferredAreas : [Text];
      budgetMin : Nat;
      budgetMax : Nat;
      propertyTypePreference : Text;
      notes : Text;
      createdAt : Int;
    }>;
    contracts : Map.Map<Nat, OldContractDocument>;
  };

  // Types for new actor state
  public type MembershipPricing = {
    monthlyPriceCents : Nat;
    annualPriceCents : Nat;
    isOnSale : Bool;
    salePriceCents : ?Nat;
  };

  public type MembershipCatalog = {
    basic : MembershipPricing;
    pro : MembershipPricing;
    enterprise : MembershipPricing;
    lastUpdated : Int;
  };

  public type NewActor = {
    nextDealId : Nat;
    nextBuyerId : Nat;
    nextContractId : Nat;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    deals : Map.Map<Nat, OldDeal>;
    buyers : Map.Map<Nat, {
      id : Nat;
      owner : Principal;
      name : Text;
      phone : Text;
      email : Text;
      preferredAreas : [Text];
      budgetMin : Nat;
      budgetMax : Nat;
      propertyTypePreference : Text;
      notes : Text;
      createdAt : Int;
    }>;
    contracts : Map.Map<Nat, OldContractDocument>;
    membershipCatalog : MembershipCatalog;
  };

  public func run(old : OldActor) : NewActor {
    let defaultMembershipCatalog : MembershipCatalog = {
      basic = {
        monthlyPriceCents = 2999;
        annualPriceCents = 29999;
        isOnSale = false;
        salePriceCents = null;
      };
      pro = {
        monthlyPriceCents = 8999;
        annualPriceCents = 89999;
        isOnSale = false;
        salePriceCents = null;
      };
      enterprise = {
        monthlyPriceCents = 29999;
        annualPriceCents = 299999;
        isOnSale = false;
        salePriceCents = null;
      };
      lastUpdated = Time.now();
    };

    {
      old with
      membershipCatalog = defaultMembershipCatalog;
    };
  };
};
