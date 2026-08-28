import type { ConfirmedTrade, DraftTrade, TradeSide } from "../types";
import { formatFeeTriple } from "../lib/format";

export interface TradeTableProps {
  trades: ConfirmedTrade[];
  draft: DraftTrade;
  draftSeq: number;
  error: string | null;
  onDraftChange: (patch: Partial<DraftTrade>) => void;
  onConfirm: () => void;
  onDeleteLast: () => void;
}

/**
 * 操作记录表：已确认行只读；仅最后一笔可删；底部草稿行可编辑确认。
 *
 * @param props 组件属性
 * @returns 操作表格
 */
export function TradeTable({
  trades,
  draft,
  draftSeq,
  error,
  onDraftChange,
  onConfirm,
  onDeleteLast,
}: TradeTableProps) {
  return (
    <div className="panel">
      <div className="panel-title">操作记录</div>
      <div className="table-wrap">
        <table className="trade-table">
          <thead>
            <tr>
              <th>次序</th>
              <th>操作</th>
              <th>数量(股)</th>
              <th>价格(元)</th>
              <th>费用明细<br />
                <span className="th-sub">佣金/印花税/过户费</span>
              </th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => {
              const isLast = index === trades.length - 1;
              return (
                <tr key={trade.seq} className="row-confirmed">
                  <td>第{trade.seq}次</td>
                  <td>{trade.side === "buy" ? "买入" : "卖出"}</td>
                  <td>{trade.quantity}</td>
                  <td>{trade.price.toFixed(2)}</td>
                  <td>
                    {formatFeeTriple(
                      trade.fees.commission,
                      trade.fees.stampTax,
                      trade.fees.transferFee,
                    )}
                  </td>
                  <td>已确认</td>
                  <td>
                    {isLast ? (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={onDeleteLast}
                      >
                        删除
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            <tr className="row-draft">
              <td>第{draftSeq}次</td>
              <td>
                <select
                  className="input select"
                  value={draft.side}
                  onChange={(e) =>
                    onDraftChange({ side: e.target.value as TradeSide })
                  }
                >
                  <option value="buy">买入</option>
                  <option value="sell">卖出</option>
                </select>
              </td>
              <td>
                <input
                  className="input num"
                  type="number"
                  min={100}
                  step={100}
                  placeholder="100 的倍数"
                  value={draft.quantity}
                  onChange={(e) => onDraftChange({ quantity: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="input num"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="价格"
                  value={draft.price}
                  onChange={(e) => onDraftChange({ price: e.target.value })}
                />
              </td>
              <td className="muted">— / — / —</td>
              <td className="muted">草稿</td>
              <td>
                <button type="button" className="btn btn-primary" onClick={onConfirm}>
                  确认
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <p className="hint">注：草稿行不可删除；仅最后一笔已确认操作可删除。</p>
    </div>
  );
}
