import type { ConfirmedTrade, PortfolioSnapshot, StockInfo } from "../types";

/**
 * 将已确认操作与汇总导出为 CSV 字符串（含 BOM，便于 Excel 打开中文）。
 *
 * @param stock 当前股票
 * @param initialCash 初始现金
 * @param trades 已确认操作
 * @param snapshot 持仓汇总
 * @returns CSV 文本
 */
export function buildTradesCsv(
  stock: StockInfo | null,
  initialCash: number,
  trades: ConfirmedTrade[],
  snapshot: PortfolioSnapshot,
): string {
  const lines: string[] = [];
  lines.push(
    "股票代码,股票简称,初始可用现金,可用现金,持股数量,成本价,持仓市值,浮动盈亏,累计已实现盈亏",
  );
  lines.push(
    [
      stock?.code ?? "",
      csvEscape(stock?.zwjc ?? ""),
      initialCash.toFixed(2),
      snapshot.cash.toFixed(2),
      String(snapshot.shares),
      snapshot.avgCost.toFixed(2),
      snapshot.totalValue.toFixed(2),
      snapshot.floatingProfit.toFixed(2),
      snapshot.realizedProfit.toFixed(2),
    ].join(","),
  );
  lines.push("");
  lines.push(
    "次序,方向,数量,价格,成交额,佣金,印花税,过户费",
  );
  for (const t of trades) {
    lines.push(
      [
        String(t.seq),
        t.side === "buy" ? "买入" : "卖出",
        String(t.quantity),
        t.price.toFixed(2),
        t.amount.toFixed(2),
        t.fees.commission.toFixed(2),
        t.fees.stampTax.toFixed(2),
        t.fees.transferFee.toFixed(2),
      ].join(","),
    );
  }
  return `\uFEFF${lines.join("\n")}`;
}

/**
 * 触发浏览器下载 CSV 文件。
 *
 * @param filename 文件名
 * @param content CSV 内容
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV 字段转义。
 *
 * @param value 原始字段
 * @returns 安全字段
 */
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
