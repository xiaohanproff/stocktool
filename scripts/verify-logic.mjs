/**
 * 无 UI 的业务逻辑自检（手续费、校验、持仓重算）。
 * 运行：node scripts/verify-logic.mjs
 */

const STAMP_TAX_RATE = 0.0005;
const TRANSFER_FEE_RATE = 0.00001;
const MIN_COMMISSION = 5;

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calcFees(side, amount, calculateFees, commissionRatePercent) {
  if (!calculateFees || amount <= 0) {
    return { commission: 0, stampTax: 0, transferFee: 0 };
  }
  const commission = Math.max(
    amount * (commissionRatePercent / 100),
    MIN_COMMISSION,
  );
  const stampTax = side === "sell" ? amount * STAMP_TAX_RATE : 0;
  const transferFee = amount * TRANSFER_FEE_RATE;
  return {
    commission: roundMoney(commission),
    stampTax: roundMoney(stampTax),
    transferFee: roundMoney(transferFee),
  };
}

function totalFees(fees) {
  return roundMoney(fees.commission + fees.stampTax + fees.transferFee);
}

function computePortfolio(initialCash, trades) {
  let cash = initialCash;
  let shares = 0;
  let avgCost = 0;
  for (const trade of trades) {
    const feeSum = totalFees(trade.fees);
    if (trade.side === "buy") {
      cash = roundMoney(cash - trade.amount - feeSum);
      const costBasis = shares * avgCost + trade.amount + feeSum;
      shares += trade.quantity;
      avgCost = shares > 0 ? roundMoney(costBasis / shares) : 0;
    } else {
      cash = roundMoney(cash + trade.amount - feeSum);
      shares -= trade.quantity;
      if (shares <= 0) {
        shares = 0;
        avgCost = 0;
      }
    }
  }
  return { cash, shares, avgCost };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const buyFees = calcFees("buy", 8500, true, 0.025);
assert(buyFees.commission === 5, "买入佣金最低 5");
assert(buyFees.stampTax === 0, "买入无印花税");

const sellFees = calcFees("sell", 1840, true, 0.025);
assert(sellFees.stampTax === 0.92, `卖出印花税应为 0.92，实际 ${sellFees.stampTax}`);

const snap = computePortfolio(100000, [
  {
    side: "buy",
    quantity: 1000,
    amount: 8500,
    fees: buyFees,
  },
  {
    side: "sell",
    quantity: 200,
    amount: 1840,
    fees: sellFees,
  },
]);

assert(snap.shares === 800, `持股应为 800，实际 ${snap.shares}`);
assert(snap.cash === 93328.97, `现金应为 93328.97，实际 ${snap.cash}`);
assert(snap.avgCost === 8.51, `成本应为 8.51，实际 ${snap.avgCost}`);

const noFee = computePortfolio(100000, [
  {
    side: "buy",
    quantity: 1000,
    amount: 8500,
    fees: calcFees("buy", 8500, false, 0.025),
  },
]);
assert(noFee.cash === 91500, `不计手续费现金应为 91500，实际 ${noFee.cash}`);
assert(noFee.avgCost === 8.5, `不计手续费成本应为 8.5，实际 ${noFee.avgCost}`);

console.log("verify-logic: OK");
console.log(JSON.stringify({ withFees: snap, noFee }, null, 2));
