import type {
  UserGetLedgerResponse,
  UserGetS1LedgerResponse,
  UserGetS2LedgerResponse,
} from "~/models/user";
import type { TableColumn } from "~/types";
type LedgerColumnKey1 = keyof UserGetS1LedgerResponse["data"][0];
type LedgerColumnKey2 = keyof UserGetS2LedgerResponse["data"][0];
type LedgerColumnKey3 = keyof UserGetLedgerResponse["data"][0];

export const STRATEGY_1_LEDGER_TABLE_COLUMNS: TableColumn<LedgerColumnKey1>[] =
  [
    { key: "id", label: "ID", type: "number" },
    { key: "eventId", label: "Event ID", type: "custom" },
    { key: "datetime", label: "Datetime", type: "string" },
    { key: "symbol", label: "Symbol", type: "string" },
    { key: "exchange", label: "Exchange", type: "string" },
    { key: "direction", label: "Direction", type: "string" },
    { key: "openOrderId", label: "Open Order ID", type: "number" },
    { key: "closeOrderId", label: "Close Order ID", type: "number" },
    { key: "openOrderCloid", label: "Open Order Cloid", type: "string" },
    { key: "closeOrderCloid", label: "Close Order Cloid", type: "string" },
    { key: "openPriceUsd", label: "Open Price (USD)", type: "number" },
    { key: "closePriceUsd", label: "Close Price (USD)", type: "number" },
    { key: "positionSize", label: "Position Size", type: "number" },
    { key: "fee", label: "Fee", type: "number" },
    { key: "closedProfit", label: "Closed Profit", type: "number" },
  ];

export const STRATEGY_2_LEDGER_TABLE_COLUMNS: TableColumn<LedgerColumnKey2>[] =
  [
    { key: "id", label: "ID", type: "number" },
    { key: "triggerEventId", label: "Trigger Event ID", type: "custom" },
    { key: "datetime", label: "Datetime", type: "date" },
    {
      key: "relativePriceIndicator",
      label: "Relative Price Indicator",
      type: "tag",
    },
    { key: "symbol", label: "Symbol", type: "string" },
    {
      key: "binanceOpenOrderId",
      label: "Binance Open Order ID",
      type: "custom",
    },
    {
      key: "binanceCloseOrderId",
      label: "Binance Close Order ID",
      type: "custom",
    },
    { key: "hyperOpenOrderId", label: "Hyper Open Order ID", type: "custom" },
    { key: "hyperCloseOrderId", label: "Hyper Close Order ID", type: "custom" },
    {
      key: "binanceOpenPositionUsd",
      label: "Binance Open Position USD",
      type: "number",
    },
    {
      key: "binanceClosePositionUsd",
      label: "Binance Close Position USD",
      type: "number",
    },
    {
      key: "hyperOpenPositionUsd",
      label: "Hyper Open Position USD",
      type: "number",
    },
    {
      key: "hyperClosePositionUsd",
      label: "Hyper Close Position USD",
      type: "number",
    },
    { key: "binanceFee", label: "Binance Fee", type: "number" },
    { key: "hyperFee", label: "Hyper Fee", type: "number" },
    { key: "net", label: "Net", type: "number" },
  ];

export const STRATEGY_3_LEDGER_TABLE_COLUMNS: TableColumn<LedgerColumnKey3>[] =
  [
    { key: "id", label: "ID", type: "number" },
    { key: "triggerEventId", label: "Trigger Event ID", type: "custom" },
    { key: "datetime", label: "Datetime", type: "date" },
    {
      key: "relativePriceIndicator",
      label: "Relative Price Indicator",
      type: "tag",
    },
    { key: "symbol", label: "Symbol", type: "string" },
    {
      key: "binanceOpenOrderId",
      label: "Binance Open Order ID",
      type: "custom",
    },
    {
      key: "binanceCloseOrderId",
      label: "Binance Close Order ID",
      type: "custom",
    },
    { key: "hyperOpenOrderId", label: "Hyper Open Order ID", type: "custom" },
    { key: "hyperCloseOrderId", label: "Hyper Close Order ID", type: "custom" },
    {
      key: "binanceOpenPositionUsd",
      label: "Binance Open Position USD",
      type: "number",
    },
    {
      key: "binanceClosePositionUsd",
      label: "Binance Close Position USD",
      type: "number",
    },
    {
      key: "hyperOpenPositionUsd",
      label: "Hyper Open Position USD",
      type: "number",
    },
    {
      key: "hyperClosePositionUsd",
      label: "Hyper Close Position USD",
      type: "number",
    },
    { key: "binanceFunding", label: "Binance Funding", type: "number" },
    { key: "hyperFunding", label: "Hyper Funding", type: "number" },
    { key: "binanceFee", label: "Binance Fee", type: "number" },
    { key: "hyperFee", label: "Hyper Fee", type: "number" },
    { key: "net", label: "Net", type: "number" },
  ];
