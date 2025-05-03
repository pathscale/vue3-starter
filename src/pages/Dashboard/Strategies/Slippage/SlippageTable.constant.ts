import type {
  UserGetS2SlippageResponse,
  UserGetSlippage1Response,
} from "~/models/user";
import type { TableColumn } from "~/types";

type SlippageColumnKey1 = keyof UserGetSlippage1Response["data"][0];
type SlippageColumnKey2 = keyof UserGetS2SlippageResponse["data"][0];

export const STRATEGY_1_SLIPPAGE_TABLE_COLUMNS: TableColumn<SlippageColumnKey1>[] =
  [
    { key: "id", label: "ID", type: "number" },
    { key: "eventId", label: "Event ID", type: "custom" },
    { key: "eventTimestamp", label: "Event Timestamp", type: "number" },
    { key: "direction", label: "Direction", type: "string" },
    { key: "symbol", label: "Symbol", type: "string" },
    {
      key: "orderbookBinanceTriggerPrice",
      label: "Orderbook Binance Trigger Price",
      type: "number",
    },
    {
      key: "orderbookHyperliquidTriggerPrice",
      label: "Orderbook Hyperliquid Trigger Price",
      type: "number",
    },
    {
      key: "binanceHyperSpreadBp",
      label: "Binance Hyper Spread Bp",
      type: "number",
    },
    {
      key: "binanceHyperSpreadLevel",
      label: "Binance Hyper Spread Level",
      type: "string",
    },
    {
      key: "avgBinHyperSpreadBp",
      label: "Avg Bin Hyper Spread Bp",
      type: "number",
    },
    {
      key: "avgBinanceHyperSpreadLevel",
      label: "Avg Binance Hyper Spread Level",
      type: "string",
    },
    {
      key: "signalBinanceChangeBp",
      label: "Signal Binance Change Bp",
      type: "number",
    },
    {
      key: "signalHyperChangeBp",
      label: "Signal Hyper Change Bp",
      type: "number",
    },
    {
      key: "signalTrendStrengthDx",
      label: "Signal Trend Strength Dx",
      type: "number",
    },
    { key: "actualBuyPrice", label: "Actual Buy Price", type: "number" },
    { key: "buyPositionUsd", label: "Buy Position USD", type: "number" },
    { key: "actualSellPrice", label: "Actual Sell Price", type: "number" },
    { key: "sellPositionUsd", label: "Sell Position USD", type: "number" },
    { key: "fee", label: "Fee", type: "number" },
    { key: "net", label: "Net", type: "number" },
    {
      key: "orderbookHyperliquidBidAtSellTime",
      label: "Orderbook Hyperliquid Bid At Sell Time",
      type: "number",
    },
    {
      key: "orderbookHyperliquidAskAtSellTime",
      label: "Orderbook Hyperliquid Ask At Sell Time",
      type: "number",
    },
    {
      key: "orderbookBinanceSellPrice",
      label: "Orderbook Binance Sell Price",
      type: "number",
    },
  ];

export const STRATEGY_2_SLIPPAGE_TABLE_COLUMNS: TableColumn<SlippageColumnKey2>[] =
  [
    { key: "id", label: "ID", type: "number" },
    { key: "triggerEventId", label: "Trigger Event ID", type: "custom" },
    {
      key: "triggerEventTimestamp",
      label: "Trigger Event Timestamp",
      type: "date",
    },
    {
      key: "relativePriceIndicator",
      label: "Relative Price Indicator",
      type: "tag",
    },
    { key: "symbol", label: "Symbol", type: "string" },
    {
      key: "binanceTriggerOpenPrice",
      label: "Binance Trigger Open Price",
      type: "number",
    },
    {
      key: "hyperTriggerOpenPrice",
      label: "Hyper Trigger Open Price",
      type: "number",
    },
    {
      key: "slippageBinanceOpenBp",
      label: "Slippage Binance Open Bp",
      type: "number",
    },
    {
      key: "slippageHyperOpenBp",
      label: "Slippage Hyper Open Bp",
      type: "number",
    },
    {
      key: "triggerOpenCrossSpreadBp",
      label: "Trigger Open Cross Spread Bp",
      type: "number",
    },
    {
      key: "triggerOpenMeanCrossSpreadBp",
      label: "Trigger Open Mean Cross Spread Bp",
      type: "number",
    },
    {
      key: "binanceOpenPositionUsd",
      label: "Binance Open Position USD",
      type: "number",
    },
    {
      key: "binanceActualOpenPrice",
      label: "Binance Actual Open Price",
      type: "number",
    },
    {
      key: "hyperOpenPositionUsd",
      label: "Hyper Open Position USD",
      type: "number",
    },
    {
      key: "hyperActualOpenPrice",
      label: "Hyper Actual Open Price",
      type: "number",
    },
    {
      key: "binanceTriggerClosePrice",
      label: "Binance Trigger Close Price",
      type: "number",
    },
    {
      key: "hyperTriggerClosePrice",
      label: "Hyper Trigger Close Price",
      type: "number",
    },
    {
      key: "triggerCloseCrossSpreadBp",
      label: "Trigger Close Cross Spread Bp",
      type: "number",
    },
    {
      key: "triggerCloseMeanCrossSpreadBp",
      label: "Trigger Close Mean Cross Spread Bp",
      type: "number",
    },
    {
      key: "binanceClosePositionUsd",
      label: "Binance Close Position USD",
      type: "number",
    },
    {
      key: "binanceActualClosePrice",
      label: "Binance Actual Close Price",
      type: "number",
    },
    {
      key: "hyperClosePositionUsd",
      label: "Hyper Close Position USD",
      type: "number",
    },
    {
      key: "hyperActualClosePrice",
      label: "Hyper Actual Close Price",
      type: "number",
    },
    {
      key: "slippageBinanceCloseBp",
      label: "Slippage Binance Close Bp",
      type: "number",
    },
    {
      key: "slippageHyperCloseBp",
      label: "Slippage Hyper Close Bp",
      type: "number",
    },
    { key: "fee", label: "Fee", type: "number" },
    {
      key: "binanceBidAskSpreadOpenBp",
      label: "Binance Bid Ask Spread Open Bp",
      type: "number",
    },
    {
      key: "hyperBidAskSpreadOpenBp",
      label: "Hyper Bid Ask Spread Open Bp",
      type: "number",
    },
    {
      key: "binanceBidAskSpreadCloseBp",
      label: "Binance Bid Ask Spread Close Bp",
      type: "number",
    },
    {
      key: "hyperBidAskSpreadCloseBp",
      label: "Hyper Bid Ask Spread Close Bp",
      type: "number",
    },
  ];
