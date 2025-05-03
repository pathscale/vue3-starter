import type {
  UserGetLivePosition1Response,
  UserGetS2LivePositionResponse,
} from "~/models/user";
import type { TableColumn } from "~/types";

type LivePositionColumnKey1 = keyof UserGetLivePosition1Response["data"][0];
type LivePositionColumnKey2 = keyof UserGetS2LivePositionResponse["data"][0];

export const STRATEGY_1_LIVE_POSITION_TABLE_COLUMNS: TableColumn<LivePositionColumnKey1>[] =
  [
    { key: "id", label: "ID", type: "number" },
    { key: "timestamp", label: "Timestamp", type: "number" },
    { key: "symbol", label: "Symbol", type: "string" },

    { key: "direction", label: "Direction", type: "string" },
    { key: "entryPrice", label: "Entry Price", type: "number" },
    { key: "size", label: "Size", type: "number" },
    { key: "entryUsdPrice", label: "Entry USD Price", type: "number" },
    { key: "currentHlPrice", label: "Current HL Price", type: "number" },
    {
      key: "currentBinancePrice",
      label: "Current Binance Price",
      type: "number",
    },

    { key: "currentUsdPrice", label: "Current USD Price", type: "number" },
    // @ts-ignore
    { key: "actions", label: "Actions", type: "custom" },
  ];

export const STRATEGY_2_LIVE_POSITION_TABLE_COLUMNS: TableColumn<LivePositionColumnKey2>[] =
  [
    { key: "id", label: "ID", type: "number" },
    { key: "eventId", label: "Event ID", type: "custom" },
    { key: "timestamp", label: "Timestamp", type: "date" },
    { key: "symbol", label: "Symbol", type: "string" },
    {
      key: "relativePriceIndicator",
      label: "Relative Price Indicator",
      type: "tag",
    },
    { key: "hyperEntryPrice", label: "Hyper Entry Price", type: "number" },
    { key: "hyperCurrentPrice", label: "Hyper Current Price", type: "number" },
    { key: "hyperSize", label: "Hyper Size", type: "number" },
    { key: "binanceEntryPrice", label: "Binance Entry Price", type: "number" },
    {
      key: "binanceCurrentPrice",
      label: "Binance Current Price",
      type: "number",
    },
    { key: "binanceSize", label: "Binance Size", type: "number" },
    {
      key: "currentBinanceHyperSpreadBp",
      label: "Current Binance Hyper Spread Bp",
      type: "number",
    },

    {
      key: "currentProfitEstimate",
      label: "Current Profit Estimate",
      type: "number",
    },
    // @ts-ignore
    { key: "actions", label: "Actions", type: "custom" },
  ];
