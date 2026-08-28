/**
 * 格式化为人民币金额显示。
 *
 * @param value 金额
 * @returns 如 ¥1,234.56
 */
export function formatMoney(value: number): string {
  return `¥${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * 格式化费用三元组展示。
 *
 * @param commission 佣金
 * @param stampTax 印花税
 * @param transferFee 过户费
 * @returns 如 21.25 / 0.00 / 1.00
 */
export function formatFeeTriple(
  commission: number,
  stampTax: number,
  transferFee: number,
): string {
  return `${commission.toFixed(2)} / ${stampTax.toFixed(2)} / ${transferFee.toFixed(2)}`;
}
