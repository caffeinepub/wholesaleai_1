import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  // Types for membership pricing and catalog
  type MembershipPricing = {
    monthlyPriceCents : Nat;
    annualPriceCents : Nat;
    isOnSale : Bool;
    salePriceCents : ?Nat;
  };

  type MembershipCatalog = {
    basic : MembershipPricing;
    pro : MembershipPricing;
    enterprise : MembershipPricing;
    lastUpdated : Int;
  };

  type UserProfile = {
    name : Text;
    phone : Text;
    email : Text;
    membershipTier : {
      #Basic;
      #Pro;
      #Enterprise;
    };
  };

  type DealStage = {
    #NewLead;
    #ContactedSeller;
    #Negotiating;
    #UnderContract;
    #Assigned;
    #Closed;
  };

  type Deal = {
    id : Nat;
    owner : Principal.Principal;
    stage : DealStage;
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

  type Buyer = {
    id : Nat;
    owner : Principal.Principal;
    name : Text;
    phone : Text;
    email : Text;
    preferredAreas : [Text];
    budgetMin : Nat;
    budgetMax : Nat;
    propertyTypePreference : Text;
    notes : Text;
    createdAt : Int;
  };

  type ContractDocument = {
    id : Nat;
    owner : Principal.Principal;
    dealId : Nat;
    documentType : { #PurchaseContract; #AssignmentContract };
    fileName : Text;
    uploadedAt : Int;
    signingStatus : { #Unsigned; #Signed };
    closingDate : ?Int;
    emd : ?Nat;
    blob : Storage.ExternalBlob;
  };

  type OldActor = {
    nextDealId : Nat;
    nextBuyerId : Nat;
    nextContractId : Nat;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    deals : Map.Map<Nat, Deal>;
    buyers : Map.Map<Nat, Buyer>;
    contracts : Map.Map<Nat, ContractDocument>;
    membershipCatalog : MembershipCatalog;
  };

  type NewActor = {
    nextDealId : Nat;
    nextBuyerId : Nat;
    nextContractId : Nat;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    deals : Map.Map<Nat, Deal>;
    buyers : Map.Map<Nat, Buyer>;
    contracts : Map.Map<Nat, ContractDocument>;
    membershipCatalog : MembershipCatalog;
  };

  func isOldDefaultPricing(catalog : MembershipCatalog) : Bool {
    // Compare against previous default prices
    catalog.basic.monthlyPriceCents == 2999
    and catalog.basic.annualPriceCents == 29999
    and catalog.pro.monthlyPriceCents == 8999
    and catalog.pro.annualPriceCents == 89999
    and catalog.enterprise.monthlyPriceCents == 29999
    and catalog.enterprise.annualPriceCents == 299999
  };

  // Migration function
  public func run(old : OldActor) : NewActor {
    let newCatalog : MembershipCatalog = {
      basic = {
        monthlyPriceCents = 499;
        annualPriceCents = 4999;
        isOnSale = false;
        salePriceCents = null;
      };
      pro = {
        monthlyPriceCents = 1499;
        annualPriceCents = 14999;
        isOnSale = false;
        salePriceCents = null;
      };
      enterprise = {
        monthlyPriceCents = 3999;
        annualPriceCents = 39999;
        isOnSale = false;
        salePriceCents = null;
      };
      lastUpdated = Time.now();
    };

    let updatedCatalog = if (isOldDefaultPricing(old.membershipCatalog)) {
      newCatalog; // Overwrite old default with new values
    } else {
      old.membershipCatalog; // Keep custom pricing from admin
    };

    {
      old with
      membershipCatalog = updatedCatalog;
    };
  };
};
