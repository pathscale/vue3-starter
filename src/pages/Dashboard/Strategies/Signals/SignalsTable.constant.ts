import type {
  UserGetS2SignalResponse,
  UserGetS3SignalResponse,
  UserGetS4SignalResponse,
  UserGetSignal1Response,
} from "~/models/user";
import type { TableColumn } from "~/types";

type SignalColumnKey1 = keyof UserGetSignal1Response["data"][0];
type SignalColumnKey2 = keyof UserGetS2SignalResponse["data"][0];
type SignalColumnKey3 = keyof UserGetS3SignalResponse["data"][0];
type SignalColumnKey4 = keyof UserGetS4SignalResponse["data"][0];

export const STRATEGY_1_SIGNALS_TABLE_COLUMNS: TableColumn<SignalColumnKey1>[] =
  [
    { key: "timestamp", label: "Timestamp", type: "number" },
    { key: "symbol", label: "Symbol", type: "string" },
    {
      key: "binanceHyperSpreadBp",
      label: "Binance Hyper Spread Bp",
      type: "number",
    },
    {
      key: "binanceHyperSpreadLevel",
      label: "Binance Hyper Spread Level",
      type: "tag",
    },
    {
      key: "avgBinanceHyperSpreadBp",
      label: "Avg Binance Hyper Spread Bp",
      type: "number",
    },
    {
      key: "avgBinanceHyperSpreadLevel",
      label: "Avg Binance Hyper Spread Level",
      type: "tag",
    },
    {
      key: "hyperBidAskSpreadBp",
      label: "Hyper Bid Ask Spread Bp",
      type: "number",
    },
    { key: "binanceChangeBp", label: "Binance Change Bp", type: "number" },
    { key: "hyperChangeBp", label: "Hyper Change Bp", type: "number" },
    {
      key: "binanceTrendStrengthDx",
      label: "Binance Trend Strength Dx",
      type: "number",
    },
    {
      key: "binanceBestAskPrice",
      label: "Binance Best Ask Price",
      type: "number",
    },
    {
      key: "hyperliquidBestAskPrice",
      label: "Hyperliquid Best Ask Price",
      type: "number",
    },
  ];

export const STRATEGY_2_SIGNALS_TABLE_COLUMNS: TableColumn<SignalColumnKey2>[] =
  [
    { key: "timestamp", label: "Timestamp", type: "date" },
    { key: "symbol", label: "Symbol", type: "string" },
    {
      key: "hyperBidBinAskSpreadBp",
      label: "Hyper Bid Bin Ask Spread Bp",
      type: "number",
    },
    {
      key: "meanHyperBidBinAskSpreadBp",
      label: "Mean Hyper Bid Bin Ask Spread Bp",
      type: "number",
    },
    {
      key: "signalLevelLongBinance",
      label: "Signal Level Long Binance",
      type: "tag",
    },
    {
      key: "binBidHyperAskSpreadBp",
      label: "Bin Bid Hyper Ask Spread Bp",
      type: "number",
    },
    {
      key: "meanBinBidHyperAskSpreadBp",
      label: "Mean Bin Bid Hyper Ask Spread Bp",
      type: "number",
    },
    {
      key: "signalLevelLongHyper",
      label: "Signal Level Long Hyper",
      type: "tag",
    },
    {
      key: "hyperBidAskSpreadBp",
      label: "Hyper Bid Ask Spread Bp",
      type: "number",
    },
    {
      key: "binanceBidAskSpreadBp",
      label: "Binance Bid Ask Spread Bp",
      type: "number",
    },
    {
      key: "binanceBestAskPrice",
      label: "Binance Best Ask Price",
      type: "number",
    },
    {
      key: "hyperliquidBestAskPrice",
      label: "Hyperliquid Best Ask Price",
      type: "number",
    },
  ];

export const STRATEGY_3_SIGNALS_TABLE_COLUMNS: TableColumn<SignalColumnKey3>[] =
  [
    { key: "timestamp", label: "Timestamp", type: "date" },
    { key: "symbol", label: "Symbol", type: "string" },
    { key: "rateLeft", label: "Rate Left", type: "number" },
    { key: "tradingVolumeLeft", label: "Trading Volume Left", type: "number" },
    { key: "rateRight", label: "Rate Right", type: "number" },
    {
      key: "tradingVolumeRight",
      label: "Trading Volume Right",
      type: "number",
    },
    { key: "rateDifference", label: "Rate Difference", type: "number" },
    {
      key: "hyperBidBinAskSpreadBp",
      label: "Hyper Bid Bin Ask Spread Bp",
      type: "number",
    },
    {
      key: "meanHyperBidBinAskSpreadBp",
      label: "Mean Hyper Bid Bin Ask Spread Bp",
      type: "number",
    },
    {
      key: "signalLevelLongBinance",
      label: "Signal Level Long Binance",
      type: "tag",
    },
    {
      key: "binBidHyperAskSpreadBp",
      label: "Bin Bid Hyper Ask Spread Bp",
      type: "number",
    },
    {
      key: "meanBinBidHyperAskSpreadBp",
      label: "Mean Bin Bid Hyper Ask Spread Bp",
      type: "number",
    },
    {
      key: "signalLevelLongHyper",
      label: "Signal Level Long Hyper",
      type: "tag",
    },
    {
      key: "hyperBidAskSpreadBp",
      label: "Hyper Bid Ask Spread Bp",
      type: "number",
    },
    {
      key: "binanceBidAskSpreadBp",
      label: "Binance Bid Ask Spread Bp",
      type: "number",
    },
    {
      key: "binanceBestAskPrice",
      label: "Binance Best Ask Price",
      type: "number",
    },
    {
      key: "hyperliquidBestAskPrice",
      label: "Hyperliquid Best Ask Price",
      type: "number",
    },
  ];

export const STRATEGY_4_SIGNALS_TABLE_COLUMNS: TableColumn<SignalColumnKey4>[] =
  [
    { key: "timestamp", label: "Timestamp", type: "date" },
    { key: "symbol", label: "Symbol", type: "string" },
    {
      key: "hyperBidAskSpreadBp",
      label: "Hyper Bid Ask Spread Bp",
      type: "number",
    },
    {
      key: "binBidHyperAskSpreadBp",
      label: "Bin Bid Hyper Ask Spread Bp",
      type: "number",
    },
    {
      key: "hyperBidBinAskSpreadBp",
      label: "Hyper Bid Bin Ask Spread Bp",
      type: "number",
    },
    { key: "binanceMidPrice", label: "Binance Mid Price", type: "number" },
    { key: "binanceBidPrice", label: "Binance Bid Price", type: "number" },
    { key: "binanceAskPrice", label: "Binance Ask Price", type: "number" },
    { key: "hyperBidPrice", label: "Hyper Bid Price", type: "number" },
    { key: "hyperAskPrice", label: "Hyper Ask Price", type: "number" },
    { key: "hyperMidPrice", label: "Hyper Mid Price", type: "number" },
  ];
