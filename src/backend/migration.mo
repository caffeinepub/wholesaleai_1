module {
  // Only value modification
  type Actor = { var nextDealId : Nat };

  public func run(oldActor : Actor) : Actor {
    oldActor;
  };
};
