/** 股票字典单条记录。 */
export interface StockInfo {
  code: string;
  pinyin: string;
  category: string;
  orgId: string;
  zwjc: string;
}

/** 买卖方向。 */
export type TradeSide = "buy" | "sell";

/** 单笔费用明细（元）。 */
export interface FeeBreakdown {
  commission: number;
  stampTax: number;
  transferFee: number;
}

/** 已确认的一笔操作。 */
export interface ConfirmedTrade {
  /** 操作序号，从 1 起。 */
  seq: number;
  side: TradeSide;
  quantity: number;
  price: number;
  fees: FeeBreakdown;
  /** 成交额 = 数量 × 价格。 */
  amount: number;
}

/** 草稿行（未确认）。 */
export interface DraftTrade {
  side: TradeSide;
  quantity: string;
  price: string;
}

/** localStorage 持久化会话。 */
export interface AppSession {
  selectedStock: StockInfo | null;
  initialCash: string;
  cashLocked: boolean;
  calculateFees: boolean;
  commissionRatePercent: string;
  trades: ConfirmedTrade[];
  draft: DraftTrade;
}

/** 持仓汇总快照。 */
export interface PortfolioSnapshot {
  cash: number;
  shares: number;
  /** 加权平均成本；无持股时为 0。 */
  avgCost: number;
  /** 持仓市值：持股 × 最近成交价（无实时行情）。 */
  totalValue: number;
  /** 浮动盈亏：市值 − 持股 × 成本价。 */
  floatingProfit: number;
  /** 累计已实现盈亏：历次卖出净收入相对成本的盈亏之和。 */
  realizedProfit: number;
}
