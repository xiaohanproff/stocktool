import type { StockInfo } from "../types";
import { SEARCH_RESULT_LIMIT } from "../constants";
import rawStocks from "../../stocks.json";

type ExchangeBucket = Record<string, StockInfo>;
type StocksFile = Record<string, ExchangeBucket>;

/** 扁平化后的全部股票列表（启动时构建一次）。 */
const ALL_STOCKS: StockInfo[] = flattenStocks(rawStocks as StocksFile);

/**
 * 将交易所分组的 stocks.json 展平为数组。
 *
 * @param data 原始字典（如 `{ szse: { "000001": {...} } }`）
 * @returns 股票数组
 */
function flattenStocks(data: StocksFile): StockInfo[] {
  const list: StockInfo[] = [];
  for (const bucket of Object.values(data)) {
    for (const item of Object.values(bucket)) {
      list.push(item);
    }
  }
  return list;
}

/**
 * 按代码、拼音或中文简称模糊搜索股票。
 *
 * 匹配规则：查询串去空白后转小写，分别与 code 前缀、pinyin 包含、zwjc 包含比对；
 * 优先精确 code，其次前缀，再按代码排序截断。
 *
 * @param query 用户输入
 * @param limit 最多返回条数
 * @returns 匹配结果
 */
export function searchStocks(
  query: string,
  limit: number = SEARCH_RESULT_LIMIT,
): StockInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }

  const exact: StockInfo[] = [];
  const prefix: StockInfo[] = [];
  const fuzzy: StockInfo[] = [];

  for (const stock of ALL_STOCKS) {
    const code = stock.code.toLowerCase();
    const pinyin = stock.pinyin.toLowerCase();
    const name = stock.zwjc.toLowerCase();

    if (code === q) {
      exact.push(stock);
      continue;
    }
    if (code.startsWith(q) || pinyin.startsWith(q)) {
      prefix.push(stock);
      continue;
    }
    if (pinyin.includes(q) || name.includes(q) || code.includes(q)) {
      fuzzy.push(stock);
    }
  }

  const byCode = (a: StockInfo, b: StockInfo) => a.code.localeCompare(b.code);
  return [...exact, ...prefix.sort(byCode), ...fuzzy.sort(byCode)].slice(
    0,
    limit,
  );
}

/**
 * 字典股票总数（用于界面提示）。
 *
 * @returns 条数
 */
export function stockCount(): number {
  return ALL_STOCKS.length;
}
