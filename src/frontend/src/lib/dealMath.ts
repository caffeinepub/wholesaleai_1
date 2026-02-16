export function calculateMAO(arv: number, repairs: number): number {
  return Math.round(arv * 0.7 - repairs);
}

export function calculateEstimatedProfit(
  arv: number,
  repairs: number,
  yourOffer: number
): number {
  const mao = calculateMAO(arv, repairs);
  return Math.max(0, mao - yourOffer);
}

export function calculateAssignmentFee(buyerPrice: number, contractPrice: number): number {
  return Math.max(0, buyerPrice - contractPrice);
}

