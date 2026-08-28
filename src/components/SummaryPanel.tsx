import type { PortfolioSnapshot } from "../types";
import { formatMoney } from "../lib/format";

export interface SummaryPanelProps {
  snapshot: PortfolioSnapshot;
  hasInitialCash: boolean;
  onExport: () => void;
  canExport: boolean;
}

/**
 * 盈亏数值的样式类：正红负绿（A 股习惯），零或空无着色。
 *
 * @param value 盈亏金额；null 表示不展示
 * @returns CSS className 片段
 */
function pnlClass(value: number | null): string {
  if (value === null || value === 0) {
    return "";
  }
  return value > 0 ? "pnl-up" : "pnl-down";
}

/**
 * 右侧持仓汇总与导出。
 *
 * @param props 组件属性
 * @returns 汇总面板
 */
export function SummaryPanel({
  snapshot,
  hasInitialCash,
  onExport,
  canExport,
}: SummaryPanelProps) {
  return (
    <aside className="summary-panel">
      <div className="panel-title">持仓汇总</div>
      <div className="stat">
        <div className="stat-label">可用现金</div>
        <div className="stat-value">
          {hasInitialCash ? formatMoney(snapshot.cash) : "—"}
        </div>
      </div>
      <div className="stat">
        <div className="stat-label">持股数量</div>
        <div className="stat-value">
          {hasInitialCash ? `${snapshot.shares} 股` : "—"}
        </div>
      </div>
      <div className="stat">
        <div className="stat-label">成本价</div>
        <div className="stat-value">
          {hasInitialCash && snapshot.shares > 0
            ? formatMoney(snapshot.avgCost)
            : hasInitialCash
              ? "—"
              : "—"}
        </div>
      </div>
      <div className="stat">
        <div className="stat-label">持股市值</div>
        <div className="stat-value">
          {hasInitialCash && snapshot.shares > 0
            ? formatMoney(snapshot.totalValue)
            : hasInitialCash
              ? "—"
              : "—"}
        </div>
      </div>
      <div className="stat">
        <div className="stat-label">累计已实现盈亏</div>
        <div
          className={`stat-value ${pnlClass(hasInitialCash ? snapshot.realizedProfit : null)}`}
        >
          {hasInitialCash ? formatMoney(snapshot.realizedProfit) : "—"}
        </div>
      </div>
      <div className="stat">
        <div className="stat-label">浮动盈亏</div>
        <div
          className={`stat-value ${pnlClass(
            hasInitialCash && snapshot.shares > 0
              ? snapshot.floatingProfit
              : null,
          )}`}
        >
          {hasInitialCash && snapshot.shares > 0
            ? formatMoney(snapshot.floatingProfit)
            : hasInitialCash
              ? "—"
              : "—"}
        </div>
      </div>
      <p className="hint summary-note">
        市值与浮动盈亏按最近成交价估算，无实时行情
      </p>
      <button
        type="button"
        className="btn btn-secondary export-btn"
        disabled={!canExport}
        onClick={onExport}
      >
        导出 CSV
      </button>
    </aside>
  );
}
