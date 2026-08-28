import { STORAGE_KEY } from "../constants";
import type { AppSession, DraftTrade } from "../types";

/** 默认草稿行。 */
export const EMPTY_DRAFT: DraftTrade = {
  side: "buy",
  quantity: "",
  price: "",
};

/**
 * 创建空白会话。
 *
 * @returns 默认会话状态
 */
export function createEmptySession(): AppSession {
  return {
    selectedStock: null,
    initialCash: "1000000",
    cashLocked: false,
    calculateFees: false,
    commissionRatePercent: "0.025",
    trades: [],
    draft: { ...EMPTY_DRAFT },
  };
}

/**
 * 从 localStorage 读取会话；损坏或缺失时返回默认会话。
 *
 * @returns 会话对象
 */
export function loadSession(): AppSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptySession();
    }
    const parsed = JSON.parse(raw) as Partial<AppSession>;
    const base = createEmptySession();
    return {
      ...base,
      ...parsed,
      draft: { ...EMPTY_DRAFT, ...(parsed.draft ?? {}) },
      trades: Array.isArray(parsed.trades) ? parsed.trades : [],
    };
  } catch {
    return createEmptySession();
  }
}

/**
 * 将会话写入 localStorage。
 *
 * @param session 当前会话
 */
export function saveSession(session: AppSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}
