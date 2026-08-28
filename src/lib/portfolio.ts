import type {
  ConfirmedTrade,
  FeeBreakdown,
  PortfolioSnapshot,
  TradeSide,
} from "../types";
import { roundMoney, totalFees } from "./fees";

/**
 * 根据初始现金与已确认操作序列，重算持仓汇总。
 *
 * 买入：现金减少成交额+买侧费用；成本按（原持仓成本+成交额+买侧费用）/新持股加权。
 * 卖出：现金增加成交额-卖侧费用；单位成本不变；累计已实现盈亏按
 * （卖出净收入 − 卖出数量×成本价）累加，清仓不归零。
 *
 * 无实时行情时，持仓市值与浮动盈亏以最近一笔成交价作为估值价：
 * 市值 = 持股 × 最近成交价；浮动盈亏 = 市值 − 持股 × 成本价。
 *
 * @param initialCash 初始可用现金
 * @param trades 已确认操作（按时间顺序）
 * @returns 持仓汇总
 */
export function computePortfolio(
  initialCash: number,
  trades: ConfirmedTrade[],
): PortfolioSnapshot {
  let cash = initialCash;
  let shares = 0;
  let avgCost = 0;
  let realizedProfit = 0;
  let lastPrice = 0;

  for (const trade of trades) {
    const feeSum = totalFees(trade.fees);
    if (trade.side === "buy") {
      cash = roundMoney(cash - trade.amount - feeSum);
      const costBasis = shares * avgCost + trade.amount + feeSum;
      shares += trade.quantity;
      avgCost = shares > 0 ? roundMoney(costBasis / shares) : 0;
      lastPrice = trade.price;
    } else {
      // 先按卖出前成本结转已实现盈亏，再减持仓
      const costOfSold = roundMoney(avgCost * trade.quantity);
      const netProceeds = roundMoney(trade.amount - feeSum);
      realizedProfit = roundMoney(realizedProfit + netProceeds - costOfSold);

      cash = roundMoney(cash + trade.amount - feeSum);
      shares -= trade.quantity;
      lastPrice = trade.price;
      if (shares <= 0) {
        shares = 0;
        avgCost = 0;
      }
    }
  }

  const { totalValue, floatingProfit } = markToLastPrice(
    shares,
    avgCost,
    lastPrice,
  );

  return { cash, shares, avgCost, totalValue, floatingProfit, realizedProfit };
}

/**
 * 用最近成交价估算持仓市值与浮动盈亏。
 *
 * @param shares 持股数量
 * @param avgCost 加权平均成本
 * @param lastPrice 最近一笔成交价
 * @returns 市值与浮动盈亏
 */
function markToLastPrice(
  shares: number,
  avgCost: number,
  lastPrice: number,
): Pick<PortfolioSnapshot, "totalValue" | "floatingProfit"> {
  if (shares <= 0 || lastPrice <= 0) {
    return { totalValue: 0, floatingProfit: 0 };
  }
  const totalValue = roundMoney(shares * lastPrice);
  const floatingProfit = roundMoney(totalValue - shares * avgCost);
  return { totalValue, floatingProfit };
}

/**
 * 校验一笔待确认操作是否允许提交。
 *
 * @param side 方向
 * @param quantity 数量
 * @param price 价格
 * @param amount 成交额
 * @param fees 费用
 * @param snapshot 当前持仓（确认前）
 * @returns 错误信息；通过时为 null
 */
export function validateTrade(
  side: TradeSide,
  quantity: number,
  price: number,
  amount: number,
  fees: FeeBreakdown,
  snapshot: PortfolioSnapshot,
): string | null {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return "数量必须为正数";
  }
  if (!Number.isInteger(quantity) || quantity % 100 !== 0) {
    return "A 股数量必须为 100 股（1 手）的整数倍";
  }
  if (!Number.isFinite(price) || price <= 0) {
    return "价格必须为正数";
  }

  const feeSum = totalFees(fees);
  if (side === "buy") {
    const need = roundMoney(amount + feeSum);
    if (need > snapshot.cash + 1e-9) {
      return `现金不足：需要 ${need.toFixed(2)} 元，可用 ${snapshot.cash.toFixed(2)} 元`;
    }
  } else if (quantity > snapshot.shares) {
    return `卖出数量超过持股：持股 ${snapshot.shares} 股`;
  }

  return null;
}
