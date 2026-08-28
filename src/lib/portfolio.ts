import type {
  ConfirmedTrade,
  FeeBreakdown,
  PortfolioSnapshot,
  TradeSide,
} from "../types";
import { roundMoney, totalFees } from "./fees";

/**
 * 根据初始现金与已确认操作序列，重算可用现金、持股与加权平均成本。
 *
 * 买入：现金减少成交额+买侧费用；成本按（原市值+成交额+买侧费用）/新持股加权。
 * 卖出：现金增加成交额-卖侧费用；单位成本不变。
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
