import { useEffect, useMemo, useState } from "react";
import { StockSearch } from "./components/StockSearch";
import { SummaryPanel } from "./components/SummaryPanel";
import { TradeTable } from "./components/TradeTable";
import { buildTradesCsv, downloadCsv } from "./lib/csv";
import { calcFees, roundMoney } from "./lib/fees";
import { computePortfolio, validateTrade } from "./lib/portfolio";
import { stockCount } from "./lib/stocks";
import {
  EMPTY_DRAFT,
  clearSession,
  createEmptySession,
  loadSession,
  saveSession,
} from "./lib/storage";
import type { AppSession, ConfirmedTrade, DraftTrade, StockInfo } from "./types";

/**
 * 应用根组件：会话状态、确认/删除、持久化与汇总。
 *
 * @returns 页面
 */
export default function App() {
  const [session, setSession] = useState<AppSession>(() => loadSession());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const initialCashNum = Number(session.initialCash);
  const hasInitialCash =
    session.initialCash.trim() !== "" &&
    Number.isFinite(initialCashNum) &&
    initialCashNum >= 0;

  const snapshot = useMemo(
    () =>
      computePortfolio(
        hasInitialCash ? initialCashNum : 0,
        session.trades,
      ),
    [hasInitialCash, initialCashNum, session.trades],
  );

  const stockLocked = session.trades.length > 0;
  const draftSeq = session.trades.length + 1;

  /**
   * 合并更新会话字段。
   *
   * @param patch 局部更新
   */
  function patchSession(patch: Partial<AppSession>): void {
    setSession((prev) => ({ ...prev, ...patch }));
  }

  /**
   * 选中股票。
   *
   * @param stock 股票信息
   */
  function handleSelectStock(stock: StockInfo): void {
    if (stockLocked) {
      return;
    }
    patchSession({ selectedStock: stock });
    setError(null);
  }

  /**
   * 更新草稿行。
   *
   * @param patch 草稿字段
   */
  function handleDraftChange(patch: Partial<DraftTrade>): void {
    setSession((prev) => ({
      ...prev,
      draft: { ...prev.draft, ...patch },
    }));
    setError(null);
  }

  /**
   * 确认当前草稿为一笔成交。
   */
  function handleConfirm(): void {
    if (!session.selectedStock) {
      setError("请先搜索并选择一只股票");
      return;
    }
    if (!hasInitialCash) {
      setError("请填写有效的初始可用现金");
      return;
    }

    const quantity = Number(session.draft.quantity);
    const price = Number(session.draft.price);
    if (!Number.isFinite(quantity) || !Number.isFinite(price)) {
      setError("请填写有效的数量和价格");
      return;
    }

    const amount = roundMoney(quantity * price);
    const commissionRate = Number(session.commissionRatePercent);
    const rateOk =
      !session.calculateFees ||
      (Number.isFinite(commissionRate) && commissionRate >= 0);

    if (!rateOk) {
      setError("请填写有效的佣金费率");
      return;
    }

    const fees = calcFees(
      session.draft.side,
      amount,
      session.calculateFees,
      session.calculateFees ? commissionRate : 0,
    );

    const message = validateTrade(
      session.draft.side,
      quantity,
      price,
      amount,
      fees,
      snapshot,
    );
    if (message) {
      setError(message);
      return;
    }

    const trade: ConfirmedTrade = {
      seq: draftSeq,
      side: session.draft.side,
      quantity,
      price: roundMoney(price),
      amount,
      fees,
    };

    setSession((prev) => ({
      ...prev,
      cashLocked: true,
      trades: [...prev.trades, trade],
      draft: { ...EMPTY_DRAFT, side: prev.draft.side },
    }));
    setError(null);
  }

  /**
   * 删除最后一笔已确认操作，并重排后续草稿序号（seq 按列表重建）。
   */
  function handleDeleteLast(): void {
    setSession((prev) => {
      if (prev.trades.length === 0) {
        return prev;
      }
      const nextTrades = prev.trades.slice(0, -1).map((t, i) => ({
        ...t,
        seq: i + 1,
      }));
      return {
        ...prev,
        trades: nextTrades,
        cashLocked: nextTrades.length > 0,
      };
    });
    setError(null);
  }

  /**
   * 导出 CSV。
   */
  function handleExport(): void {
    if (!hasInitialCash) {
      return;
    }
    const csv = buildTradesCsv(
      session.selectedStock,
      initialCashNum,
      session.trades,
      snapshot,
    );
    const code = session.selectedStock?.code ?? "trades";
    downloadCsv(`${code}-trades.csv`, csv);
  }

  /**
   * 重置全部记账数据（需二次确认）。
   */
  function handleReset(): void {
    const ok = window.confirm(
      "确定要重置吗？将清除已选股票、初始现金、全部操作记录与本地保存，此操作不可撤销。",
    );
    if (!ok) {
      return;
    }
    clearSession();
    setSession(createEmptySession());
    setError(null);
  }

  return (
    <div className="app">
      <header className="top-bar">
        <div className="brand">
          <h1>股票交易计算工具</h1>
          <p className="sub">
            手动记账 · 字典 {stockCount()} 只 · 刷新后自动保留
          </p>
        </div>
        <div className="top-fields">
          <div className="field">
            <span>初始可用现金</span>
            <div className="cash-row">
              <input
                className="input"
                type="number"
                min={0}
                step={0.01}
                placeholder="例如 100000"
                aria-label="初始可用现金"
                value={session.initialCash}
                disabled={session.cashLocked}
                onChange={(e) =>
                  patchSession({ initialCash: e.target.value })
                }
              />
              {session.cashLocked && (
                <span className="lock-icon" aria-hidden="true">
                  已锁定
                </span>
              )}
            </div>
          </div>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={session.calculateFees}
              onChange={(e) =>
                patchSession({ calculateFees: e.target.checked })
              }
            />
            <span>计算手续费</span>
          </label>
          {session.calculateFees && (
            <label className="field">
              <span>佣金费率(%)</span>
              <input
                className="input"
                type="number"
                min={0}
                step={0.001}
                value={session.commissionRatePercent}
                onChange={(e) =>
                  patchSession({ commissionRatePercent: e.target.value })
                }
              />
            </label>
          )}
        </div>
      </header>

      <main className="layout">
        <section className="main-col">
          <StockSearch
            selected={session.selectedStock}
            onSelect={handleSelectStock}
            locked={stockLocked}
          />
          <TradeTable
            trades={session.trades}
            draft={session.draft}
            draftSeq={draftSeq}
            error={error}
            onDraftChange={handleDraftChange}
            onConfirm={handleConfirm}
            onDeleteLast={handleDeleteLast}
          />
        </section>
        <SummaryPanel
          snapshot={snapshot}
          hasInitialCash={hasInitialCash}
          onExport={handleExport}
          canExport={hasInitialCash && session.trades.length > 0}
          onReset={handleReset}
        />
      </main>
    </div>
  );
}
