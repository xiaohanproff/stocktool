import { useEffect, useId, useRef, useState } from "react";
import { searchStocks } from "../lib/stocks";
import type { StockInfo } from "../types";

export interface StockSearchProps {
  /** 已选中的股票；选中后仍可重新搜索更换（若已有成交则由上层决定是否允许）。 */
  selected: StockInfo | null;
  /** 用户从下拉选中一只股票。 */
  onSelect: (stock: StockInfo) => void;
  /** 是否禁止更换股票（有成交后锁定）。 */
  locked: boolean;
}

/**
 * 股票搜索框：支持代码、拼音、中文简称，多结果下拉选择。
 *
 * @param props 组件属性
 * @returns 搜索区域
 */
export function StockSearch({ selected, onSelect, locked }: StockSearchProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = query.trim() ? searchStocks(query) : [];

  useEffect(() => {
    /**
     * 点击外部关闭下拉。
     *
     * @param event 鼠标事件
     */
    function onDocClick(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="panel search-panel" ref={rootRef}>
      <div className="panel-title">搜索股票</div>
      {selected && (
        <div className="selected-stock" aria-live="polite">
          {selected.code} {selected.zwjc}
          {locked && <span className="lock-tag">已锁定</span>}
        </div>
      )}
      <input
        className="input"
        type="search"
        placeholder="代码 / 拼音 / 简称"
        value={query}
        disabled={locked}
        autoComplete="off"
        aria-controls={listId}
        aria-expanded={open && results.length > 0}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && !locked && (
        <ul id={listId} className="search-dropdown" role="listbox">
          {results.map((stock) => (
            <li key={stock.code} role="option">
              <button
                type="button"
                className="search-option"
                onClick={() => {
                  onSelect(stock);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="opt-code">{stock.code}</span>
                <span className="opt-name">{stock.zwjc}</span>
                <span className="opt-py">{stock.pinyin}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && results.length === 0 && !locked && (
        <div className="search-empty">无匹配股票</div>
      )}
    </div>
  );
}
