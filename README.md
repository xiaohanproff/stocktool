# stocktool

在线 A 股交易记账 / 持仓计算工具（v1）：手动多笔买卖记账 + 持仓汇总。

## 功能

- 本地 `stocks.json` 搜索（代码 / 拼音 / 中文简称）
- 初始可用现金；首次操作确认后锁定
- 买入 / 卖出记账；数量须为 100 股整数倍
- 可选手续费：佣金（自填）+ 印花税 + 过户费
- 右侧实时：可用现金、持股数量、加权平均成本价
- `localStorage` 刷新保留；可导出 CSV

## 开发

```bash
npm install
npm run dev
```

## 构建与部署

```bash
npm run build
```

将 `dist/` 部署到任意静态服务器（GitHub Pages / Vercel / Nginx 等）。

## 数据

股票字典为根目录 `stocks.json`（按交易所分组）。当前为深交所数据，约六千余只。
