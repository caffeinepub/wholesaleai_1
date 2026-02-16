import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Float "mo:core/Float";

import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import List "mo:core/List";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Migration "migration";

// Data migration with new actor definition via with-clause
(with migration = Migration.run)
actor {
  include MixinStorage();

  // Initialize access control
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Membership tiers
  public type MembershipTier = {
    #Basic;
    #Pro;
    #Enterprise;
  };

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

  // User Profile
  public type UserProfile = {
    name : Text;
    phone : Text;
    email : Text;
    membershipTier : MembershipTier;
  };

  // Extended user profile to persist user status
  public type CustomUserProfile = {
    profile : UserProfile;
    isFirstTime : Bool;
  };

  public type PaymentConfiguration = {
    secretKey : Text;
    allowedCountries : [Text];
  };

  public type PaymentSession = {
    sessionId : Text;
    userId : Principal;
    membershipTier : MembershipTier;
    isAnnual : Bool;
    createdAt : Int;
    status : { #pending; #completed; #failed : { error : Text } };
  };

  // Deal stages
  public type DealStage = {
    #NewLead;
    #ContactedSeller;
    #Negotiating;
    #UnderContract;
    #Assigned;
    #Closed;
  };

  // Deal data model
  public type Deal = {
    id : Nat;
    owner : Principal;
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

  // Buyer data model
  public type Buyer = {
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
  };

  // Contract data model
  public type ContractDocument = {
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

  // AI Analysis result
  public type DealAnalysis = {
    address : Text;
    estimatedARV : Nat;
    lastSoldPrice : ?Nat;
    estimatedRehabCost : Nat;
    comparableSales : [ComparableSale];
    estimatedMAO : Nat;
    estimatedAssignmentFee : Nat;
    dealRating : { #A; #B; #C; #Risky };
    suggestedOfferPrice : Nat;
  };

  public type ComparableSale = {
    address : Text;
    soldPrice : Nat;
    soldDate : Int;
    distance : Float;
  };

  // Analytics data
  public type AnalyticsData = {
    averageAssignmentFee : Float;
    monthlyRevenue : Nat;
    closeRate : Float;
    dealConversionPercent : Float;
    leadToContractPercent : Float;
    profitByZipCode : [(Text, Nat)];
  };

  // Stripe integration
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  // Storage
  var nextDealId : Nat = 1;
  var nextBuyerId : Nat = 1;
  var nextContractId : Nat = 1;

  let userProfiles = Map.empty<Principal, CustomUserProfile>(); // NOW for persistent isFirstTime per user
  let deals = Map.empty<Nat, Deal>();
  let buyers = Map.empty<Nat, Buyer>();
  let contracts = Map.empty<Nat, ContractDocument>();
  let paymentSessions = Map.empty<Text, PaymentSession>();

  // Membership catalog state
  var membershipCatalog : MembershipCatalog = {
    basic = {
      monthlyPriceCents = 699;
      annualPriceCents = 4999;
      isOnSale = false;
      salePriceCents = null;
    };
    pro = {
      monthlyPriceCents = 1999;
      annualPriceCents = 14999;
      isOnSale = false;
      salePriceCents = null;
    };
    enterprise = {
      monthlyPriceCents = 5999;
      annualPriceCents = 39999;
      isOnSale = false;
      salePriceCents = null;
    };
    lastUpdated = Time.now();
  };

  // Helper: Check if caller is authenticated (not anonymous)
  func isAuthenticated(caller : Principal) : Bool {
    not caller.isAnonymous();
  };

  // Helper: Check membership tier
  func checkMembershipTier(caller : Principal, requiredTier : MembershipTier) : Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?customProfile) {
        switch (requiredTier) {
          case (#Basic) { true };
          case (#Pro) {
            customProfile.profile.membershipTier == #Pro or customProfile.profile.membershipTier == #Enterprise;
          };
          case (#Enterprise) {
            customProfile.profile.membershipTier == #Enterprise;
          };
        };
      };
    };
  };

  // Helper: Count active deals for user
  func countActiveDeals(owner : Principal) : Nat {
    var count = 0;
    for ((_, deal) in deals.entries()) {
      if (deal.owner == owner and deal.stage != #Closed) {
        count += 1;
      };
    };
    count;
  };

  // Helper: Get user deals
  func getUserDeals(owner : Principal) : [Deal] {
    let userDeals = deals.values().toArray().filter(
      func(deal : Deal) : Bool { deal.owner == owner }
    );
    userDeals;
  };

  // Helper: Get user buyers
  func getUserBuyers(owner : Principal) : [Buyer] {
    let userBuyers = buyers.values().toArray().filter(
      func(buyer : Buyer) : Bool { buyer.owner == owner }
    );
    userBuyers;
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // Returns empty/none result if not found, does not trap
    if (not isAuthenticated(caller)) {
      return null;
    };
    userProfiles.get(caller).map(func(custom) { custom.profile });
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Allow any authenticated user to view their own profile
    // Admins can view any profile
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user).map(func(custom) { custom.profile });
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // Allow any authenticated user to save their own profile
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };

    // Check if this is a new user (no profile exists)
    let isNewUser = userProfiles.get(caller) == null;

    let customProfile : CustomUserProfile = {
      profile = profile;
      isFirstTime = false;
    };
    userProfiles.add(caller, customProfile);

    // CRITICAL FIX: Assign user role to new users immediately after profile creation
    if (isNewUser) {
      AccessControl.assignRole(accessControlState, caller, caller, #user);
    };
  };

  // Initialize default profile for first-time users
  public shared ({ caller }) func initializeProfile() : async UserProfile {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };

    switch (userProfiles.get(caller)) {
      case (?existingProfile) { existingProfile.profile };
      case (null) {
        let defaultProfile : CustomUserProfile = {
          profile = {
            name = "";
            phone = "";
            email = "";
            membershipTier = #Basic;
          };
          isFirstTime = true;
        };
        userProfiles.add(caller, defaultProfile);

        // CRITICAL FIX: Assign user role immediately after profile initialization
        AccessControl.assignRole(accessControlState, caller, caller, #user);

        defaultProfile.profile;
      };
    };
  };

  // Persistent first-time check for new users
  public shared ({ caller }) func isFirstTimeUser() : async Bool {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };

    let currentProfile = getCurrentUserProfile(caller);
    if (currentProfile.isFirstTime) {
      userProfiles.add(caller, { currentProfile with isFirstTime = false });
      true;
    } else {
      false;
    };
  };

  public query ({ caller }) func hasUserProfile() : async Bool {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    userProfiles.containsKey(caller);
  };

  func getCurrentUserProfile(caller : Principal) : CustomUserProfile {
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
  };

  // AI Deal Analyzer
  public shared ({ caller }) func analyzeDeal(address : Text) : async DealAnalysis {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can analyze deals");
    };

    // Mock AI analysis (in production, this would call external APIs)
    let analysis : DealAnalysis = {
      address = address;
      estimatedARV = 250_000;
      lastSoldPrice = ?180_000;
      estimatedRehabCost = 35_000;
      comparableSales = [
        { address = "123 Main St"; soldPrice = 245_000; soldDate = Time.now() - 259_200_000_000_000; distance = 0.3 },
        { address = "456 Oak Ave"; soldPrice = 255_000; soldDate = Time.now() - 518_400_000_000_000; distance = 0.5 },
        { address = "789 Elm Dr"; soldPrice = 248_000; soldDate = Time.now() - 777_600_000_000_000; distance = 0.7 },
      ];
      estimatedMAO = 162_500;
      estimatedAssignmentFee = 8_000;
      dealRating = #B;
      suggestedOfferPrice = 155_000;
    };

    analysis;
  };

  // Deal Management
  public shared ({ caller }) func createDeal(
    sellerName : Text,
    sellerPhone : Text,
    address : Text,
    arv : Nat,
    repairs : Nat,
    askingPrice : Nat,
    yourOffer : Nat,
    notes : Text,
    estimatedProfit : Nat,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create deals");
    };

    // Check Basic tier limit (15 active deals)
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?customProfile) {
        if (customProfile.profile.membershipTier == #Basic) {
          let activeCount = countActiveDeals(caller);
          if (activeCount >= 15) {
            Runtime.trap("Basic tier limited to 15 active deals. Upgrade to Pro or Enterprise.");
          };
        };
      };
    };

    let dealId = nextDealId;
    let now = Time.now();
    let deal : Deal = {
      id = dealId;
      owner = caller;
      stage = #NewLead;
      sellerName = sellerName;
      sellerPhone = sellerPhone;
      address = address;
      arv = arv;
      repairs = repairs;
      askingPrice = askingPrice;
      yourOffer = yourOffer;
      assignedBuyer = null;
      contractDeadline = null;
      notes = notes;
      estimatedProfit = estimatedProfit;
      actualProfit = null;
      createdAt = now;
      updatedAt = now;
    };

    deals.add(dealId, deal);
    nextDealId += 1;
    dealId;
  };

  public query ({ caller }) func getDeal(dealId : Nat) : async ?Deal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view deals");
    };

    switch (deals.get(dealId)) {
      case (null) { null };
      case (?deal) {
        if (deal.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own deals");
        };
        ?deal;
      };
    };
  };

  public query ({ caller }) func listDeals() : async [Deal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list deals");
    };
    getUserDeals(caller);
  };

  public shared ({ caller }) func updateDeal(
    dealId : Nat,
    stage : DealStage,
    sellerName : Text,
    sellerPhone : Text,
    address : Text,
    arv : Nat,
    repairs : Nat,
    askingPrice : Nat,
    yourOffer : Nat,
    assignedBuyer : ?Nat,
    contractDeadline : ?Int,
    notes : Text,
    estimatedProfit : Nat,
    actualProfit : ?Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update deals");
    };

    switch (deals.get(dealId)) {
      case (null) { Runtime.trap("Deal not found") };
      case (?deal) {
        if (deal.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own deals");
        };

        let updatedDeal : Deal = {
          id = deal.id;
          owner = deal.owner;
          stage = stage;
          sellerName = sellerName;
          sellerPhone = sellerPhone;
          address = address;
          arv = arv;
          repairs = repairs;
          askingPrice = askingPrice;
          yourOffer = yourOffer;
          assignedBuyer = assignedBuyer;
          contractDeadline = contractDeadline;
          notes = notes;
          estimatedProfit = estimatedProfit;
          actualProfit = actualProfit;
          createdAt = deal.createdAt;
          updatedAt = Time.now();
        };
        deals.add(dealId, updatedDeal);
      };
    };
  };

  public shared ({ caller }) func deleteDeal(dealId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete deals");
    };

    switch (deals.get(dealId)) {
      case (null) { Runtime.trap("Deal not found") };
      case (?deal) {
        if (deal.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own deals");
        };
        deals.remove(dealId);
      };
    };
  };

  public shared ({ caller }) func moveDealToStage(dealId : Nat, newStage : DealStage) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can move deals");
    };

    switch (deals.get(dealId)) {
      case (null) { Runtime.trap("Deal not found") };
      case (?deal) {
        if (deal.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only move your own deals");
        };

        let updatedDeal : Deal = {
          deal with stage = newStage;
          updatedAt = Time.now();
        };
        deals.add(dealId, updatedDeal);
      };
    };
  };

  // Buyers List (Pro+ only)
  public shared ({ caller }) func createBuyer(
    name : Text,
    phone : Text,
    email : Text,
    preferredAreas : [Text],
    budgetMin : Nat,
    budgetMax : Nat,
    propertyTypePreference : Text,
    notes : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create buyers");
    };

    if (not checkMembershipTier(caller, #Pro)) {
      Runtime.trap("Buyers List requires Pro or Enterprise membership");
    };

    let buyerId = nextBuyerId;
    let buyer : Buyer = {
      id = buyerId;
      owner = caller;
      name = name;
      phone = phone;
      email = email;
      preferredAreas = preferredAreas;
      budgetMin = budgetMin;
      budgetMax = budgetMax;
      propertyTypePreference = propertyTypePreference;
      notes = notes;
      createdAt = Time.now();
    };
    buyers.add(buyerId, buyer);
    nextBuyerId += 1;
    buyerId;
  };

  public query ({ caller }) func getBuyer(buyerId : Nat) : async ?Buyer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view buyers");
    };

    if (not checkMembershipTier(caller, #Pro)) {
      Runtime.trap("Buyers List requires Pro or Enterprise membership");
    };

    switch (buyers.get(buyerId)) {
      case (null) { null };
      case (?buyer) {
        if (buyer.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own buyers");
        };
        ?buyer;
      };
    };
  };

  public query ({ caller }) func listBuyers() : async [Buyer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list buyers");
    };

    if (not checkMembershipTier(caller, #Pro)) {
      Runtime.trap("Buyers List requires Pro or Enterprise membership");
    };

    getUserBuyers(caller);
  };

  public shared ({ caller }) func updateBuyer(
    buyerId : Nat,
    name : Text,
    phone : Text,
    email : Text,
    preferredAreas : [Text],
    budgetMin : Nat,
    budgetMax : Nat,
    propertyTypePreference : Text,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update buyers");
    };

    if (not checkMembershipTier(caller, #Pro)) {
      Runtime.trap("Buyers List requires Pro or Enterprise membership");
    };

    switch (buyers.get(buyerId)) {
      case (null) { Runtime.trap("Buyer not found") };
      case (?buyer) {
        if (buyer.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own buyers");
        };

        let updatedBuyer : Buyer = {
          id = buyer.id;
          owner = buyer.owner;
          name = name;
          phone = phone;
          email = email;
          preferredAreas = preferredAreas;
          budgetMin = budgetMin;
          budgetMax = budgetMax;
          propertyTypePreference = propertyTypePreference;
          notes = notes;
          createdAt = buyer.createdAt;
        };
        buyers.add(buyerId, updatedBuyer);
      };
    };
  };

  public shared ({ caller }) func deleteBuyer(buyerId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete buyers");
    };

    if (not checkMembershipTier(caller, #Pro)) {
      Runtime.trap("Buyers List requires Pro or Enterprise membership");
    };

    switch (buyers.get(buyerId)) {
      case (null) { Runtime.trap("Buyer not found") };
      case (?buyer) {
        if (buyer.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own buyers");
        };
        buyers.remove(buyerId);
      };
    };
  };

  public shared ({ caller }) func assignBuyerToDeal(dealId : Nat, buyerId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can assign buyers");
    };

    if (not checkMembershipTier(caller, #Pro)) {
      Runtime.trap("Buyer assignment requires Pro or Enterprise membership");
    };

    switch (deals.get(dealId)) {
      case (null) { Runtime.trap("Deal not found") };
      case (?deal) {
        if (deal.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only assign buyers to your own deals");
        };

        switch (buyers.get(buyerId)) {
          case (null) { Runtime.trap("Buyer not found") };
          case (?buyer) {
            if (buyer.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only assign your own buyers");
            };

            let updatedDeal : Deal = {
              deal with assignedBuyer = ?buyerId;
              updatedAt = Time.now();
            };
            deals.add(dealId, updatedDeal);
          };
        };
      };
    };
  };

  // Contracts (Enterprise only)
  public shared ({ caller }) func uploadContract(
    dealId : Nat,
    documentType : { #PurchaseContract; #AssignmentContract },
    fileName : Text,
    closingDate : ?Int,
    emd : ?Nat,
    blob : Storage.ExternalBlob,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload contracts");
    };

    if (not checkMembershipTier(caller, #Enterprise)) {
      Runtime.trap("Contracts feature requires Enterprise membership");
    };

    switch (deals.get(dealId)) {
      case (null) { Runtime.trap("Deal not found") };
      case (?deal) {
        if (deal.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only upload contracts for your own deals");
        };

        let contractId = nextContractId;
        let contract : ContractDocument = {
          id = contractId;
          owner = caller;
          dealId = dealId;
          documentType = documentType;
          fileName = fileName;
          uploadedAt = Time.now();
          signingStatus = #Unsigned;
          closingDate = closingDate;
          emd = emd;
          blob = blob;
        };
        contracts.add(contractId, contract);
        nextContractId += 1;
        contractId;
      };
    };
  };

  public query ({ caller }) func getContract(contractId : Nat) : async ?ContractDocument {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contracts");
    };

    if (not checkMembershipTier(caller, #Enterprise)) {
      Runtime.trap("Contracts feature requires Enterprise membership");
    };

    switch (contracts.get(contractId)) {
      case (null) { null };
      case (?contract) {
        if (contract.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own contracts");
        };
        ?contract;
      };
    };
  };

  public query ({ caller }) func listContractsByDeal(dealId : Nat) : async [ContractDocument] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list contracts");
    };

    if (not checkMembershipTier(caller, #Enterprise)) {
      Runtime.trap("Contracts feature requires Enterprise membership");
    };

    switch (deals.get(dealId)) {
      case (null) { Runtime.trap("Deal not found") };
      case (?deal) {
        if (deal.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only list contracts for your own deals");
        };

        let dealContracts = contracts.values().toArray().filter(
          func(contract : ContractDocument) : Bool {
            contract.dealId == dealId and contract.owner == caller
          }
        );
        dealContracts;
      };
    };
  };

  public shared ({ caller }) func updateContractStatus(
    contractId : Nat,
    signingStatus : { #Unsigned; #Signed },
    closingDate : ?Int,
    emd : ?Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update contracts");
    };

    if (not checkMembershipTier(caller, #Enterprise)) {
      Runtime.trap("Contracts feature requires Enterprise membership");
    };

    switch (contracts.get(contractId)) {
      case (null) { Runtime.trap("Contract not found") };
      case (?contract) {
        if (contract.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own contracts");
        };

        let updatedContract : ContractDocument = {
          contract with signingStatus = signingStatus;
          closingDate = closingDate;
          emd = emd;
        };
        contracts.add(contractId, updatedContract);
      };
    };
  };

  // Analytics (Enterprise only)
  public query ({ caller }) func getAnalytics() : async AnalyticsData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view analytics");
    };

    if (not checkMembershipTier(caller, #Enterprise)) {
      Runtime.trap("Analytics feature requires Enterprise membership");
    };

    let userDeals = getUserDeals(caller);

    // Calculate metrics
    var totalAssignmentFees : Nat = 0;
    var assignmentCount : Nat = 0;
    var closedDeals : Nat = 0;
    var totalDeals : Nat = userDeals.size();
    var underContractDeals : Nat = 0;
    var leadCount : Nat = 0;

    for (deal in userDeals.vals()) {
      if (deal.stage == #Closed) {
        closedDeals += 1;
        switch (deal.actualProfit) {
          case (?profit) {
            totalAssignmentFees += profit;
            assignmentCount += 1;
          };
          case (null) {};
        };
      };
      if (deal.stage == #UnderContract or deal.stage == #Assigned or deal.stage == #Closed) {
        underContractDeals += 1;
      };
      if (deal.stage == #NewLead) {
        leadCount += 1;
      };
    };

    let avgFee : Float = if (assignmentCount > 0) {
      let assignmentCountInt : Int = assignmentCount.toInt();
      let totalAssignmentFeesInt : Int = totalAssignmentFees.toInt();
      totalAssignmentFeesInt.toFloat() / assignmentCountInt.toFloat();
    } else { 0.0 };

    let closeRate : Float = if (totalDeals > 0) {
      let closedDealsInt : Int = closedDeals.toInt();
      let totalDealsInt : Int = totalDeals.toInt();
      closedDealsInt.toFloat() / totalDealsInt.toFloat() * 100.0;
    } else { 0.0 };

    let conversionRate : Float = if (totalDeals > 0) {
      let underContractDealsInt : Int = underContractDeals.toInt();
      let totalDealsInt : Int = totalDeals.toInt();
      underContractDealsInt.toFloat() / totalDealsInt.toFloat() * 100.0;
    } else { 0.0 };

    let leadToContract : Float = if (leadCount > 0) {
      let underContractDealsInt : Int = underContractDeals.toInt();
      let leadCountInt : Int = leadCount.toInt();
      underContractDealsInt.toFloat() / leadCountInt.toFloat() * 100.0;
    } else { 0.0 };

    // Simplified profit by zip (would need proper zip extraction in production)
    let profitByZip : [(Text, Nat)] = [];

    {
      averageAssignmentFee = avgFee;
      monthlyRevenue = totalAssignmentFees;
      closeRate = closeRate;
      dealConversionPercent = conversionRate;
      leadToContractPercent = leadToContract;
      profitByZipCode = profitByZip;
    };
  };

  public shared ({ caller }) func createDealFromAnalysis(
    analysis : DealAnalysis,
    sellerName : Text,
    sellerPhone : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create deals");
    };

    // Check Basic tier limit (15 active deals)
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?customProfile) {
        if (customProfile.profile.membershipTier == #Basic) {
          let activeCount = countActiveDeals(caller);
          if (activeCount >= 15) {
            Runtime.trap("Basic tier limited to 15 active deals. Upgrade to Pro or Enterprise.");
          };
        };
      };
    };

    let dealId = nextDealId;
    let now = Time.now();
    let deal : Deal = {
      id = dealId;
      owner = caller;
      stage = #NewLead;
      sellerName = sellerName;
      sellerPhone = sellerPhone;
      address = analysis.address;
      arv = analysis.estimatedARV;
      repairs = analysis.estimatedRehabCost;
      askingPrice = switch (analysis.lastSoldPrice) { case (null) { 0 }; case (?price) { price } };
      yourOffer = analysis.suggestedOfferPrice;
      assignedBuyer = null;
      contractDeadline = null;
      notes = "";
      estimatedProfit = analysis.estimatedAssignmentFee;
      actualProfit = null;
      createdAt = now;
      updatedAt = now;
    };
    deals.add(dealId, deal);
    nextDealId += 1;
    dealId;
  };

  // Public query for frontend to get current membership catalog
  // This is accessible to all users including guests to allow browsing pricing
  public query func getMembershipCatalog() : async MembershipCatalog {
    membershipCatalog;
  };

  // Admin operation to update membership pricing
  public shared ({ caller }) func updateMembershipPricing(
    basic : MembershipPricing,
    pro : MembershipPricing,
    enterprise : MembershipPricing,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update pricing");
    };

    membershipCatalog := {
      basic;
      pro;
      enterprise;
      lastUpdated = Time.now();
    };
  };

  // Admin operation for user to admin upgrade/downgrade memberships without payment
  public shared ({ caller }) func updateMembershipTier(
    userId : Principal,
    tier : MembershipTier,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update membership tiers");
    };

    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?customProfile) {
        let updatedProfile : CustomUserProfile = {
          profile = {
            customProfile.profile with
            membershipTier = tier;
          };
          isFirstTime = customProfile.isFirstTime;
        };
        userProfiles.add(userId, updatedProfile);
      };
    };
  };

  // Stripe Configuration Management
  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Membership Payment & Access Control

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  // Called by frontend to finalize membership after payment is confirmed
  public shared ({ caller }) func confirmMembershipPurchased(sessionId : Text) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };

    switch (paymentSessions.get(sessionId)) {
      case (null) { Runtime.trap("Invalid payment session") };
      case (?session) {
        // Verify caller owns this session
        if (caller != session.userId) {
          Runtime.trap("Unauthorized: Only the user who created the session can confirm it");
        };

        // Payment verified - now grant membership
        switch (userProfiles.get(session.userId)) {
          case (null) {
            Runtime.trap("User profile not found. Please create a profile first.");
          };
          case (?existingProfile) {
            let updatedProfile : CustomUserProfile = {
              existingProfile with
              profile = {
                existingProfile.profile with
                membershipTier = session.membershipTier;
              };
            };
            userProfiles.add(session.userId, updatedProfile);

            // Update session status to completed
            let completedSession : PaymentSession = {
              session with status = #completed;
            };
            paymentSessions.add(sessionId, completedSession);
          };
        };
      };
    };
  };

  // Stripe payment status checking (authenticated users only, must own session or be admin)
  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };

    // Verify caller is admin or session owner
    switch (paymentSessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?session) {
        if (caller != session.userId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only check status of your own payment sessions");
        };
        await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
      };
    };
  };

  // Function to get payment session (authenticated users only, must own session or be admin)
  public query ({ caller }) func getPaymentSession(sessionId : Text) : async ?PaymentSession {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Authentication required");
    };

    switch (paymentSessions.get(sessionId)) {
      case (null) { null };
      case (?session) {
        if (caller != session.userId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own payment sessions");
        };
        ?session;
      };
    };
  };
};
