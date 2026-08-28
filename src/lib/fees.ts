import {
  MIN_COMMISSION,
  STAMP_TAX_RATE,
  TRANSFER_FEE_RATE,
} from "../constants";
import type { FeeBreakdown, TradeSide } from "../types";

/**
 * 按成交额与方向计算手续费明细。
 *
 * 不计算手续费时三项均为 0。勾选时：佣金按用户费率（不低于最低佣金），
 * 印花税仅卖出，过户费买卖双向。
 *
 * @param side 买卖方向
 * @param amount 成交额（数量 × 价格）
 * @param calculateFees 是否计算手续费
 * @param commissionRatePercent 佣金费率（百分数，如 0.025 表示 0.025%）
 * @returns 费用明细（元）
 */
export function calcFees(
  side: TradeSide,
  amount: number,
  calculateFees: boolean,
  commissionRatePercent: number,
): FeeBreakdown {
  if (!calculateFees || amount <= 0) {
    return { commission: 0, stampTax: 0, transferFee: 0 };
  }

  const rate = commissionRatePercent / 100;
  const rawCommission = amount * rate;
  const commission = Math.max(rawCommission, MIN_COMMISSION);
  const stampTax = side === "sell" ? amount * STAMP_TAX_RATE : 0;
  const transferFee = amount * TRANSFER_FEE_RATE;

  return {
    commission: roundMoney(commission),
    stampTax: roundMoney(stampTax),
    transferFee: roundMoney(transferFee),
  };
}

/**
 * 费用合计。
 *
 * @param fees 费用明细
 * @returns 合计金额（元）
 */
export function totalFees(fees: FeeBreakdown): number {
  return roundMoney(fees.commission + fees.stampTax + fees.transferFee);
}

/**
 * 金额四舍五入到分。
 *
 * @param value 原始金额
 * @returns 保留两位小数的金额
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
