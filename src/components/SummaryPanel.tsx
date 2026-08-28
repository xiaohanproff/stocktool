import type { PortfolioSnapshot } from "../types";
import { formatMoney } from "../lib/format";

export interface SummaryPanelProps {
  snapshot: PortfolioSnapshot;
  hasInitialCash: boolean;
  onExport: () => void;
  canExport: boolean;
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
      <p className="hint summary-note">自填价格记账，无实时行情</p>
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
