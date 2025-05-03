import type {
  UserGetDebugEvent1Response,
  UserGetS2DebugEventResponse,
} from "~/models/user";
import type { TableColumn } from "~/types";

type EventColumnKey1 = keyof UserGetDebugEvent1Response["data"][0];
type EventColumnKey2 = keyof UserGetS2DebugEventResponse["data"][0];

export const STRATEGY_1_EVENTS_TABLE_COLUMNS: TableColumn<EventColumnKey1>[] = [
  { key: "id", label: "Event ID", type: "number" },
  { key: "timestamp", label: "Datetime", type: "date" },
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "direction", label: "Direction", type: "string" },
  { key: "opportunityPrice", label: "Opportunity Price", type: "number" },
  { key: "opportunitySize", label: "Opportunity Size", type: "number" },
  { key: "status", label: "Status", type: "tag" },
];

export const STRATEGY_2_EVENTS_TABLE_COLUMNS: TableColumn<EventColumnKey2>[] = [
  { key: "id", label: "Event ID", type: "number" },
  { key: "timestamp", label: "Datetime", type: "date" },
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "eventType", label: "Event Type", type: "tag" },
  {
    key: "relativePriceIndicator",
    label: "Relative Price Indicator",
    type: "tag",
  },
  { key: "spreadBp", label: "Spread Bp", type: "number" },
  { key: "oppHyperPrice", label: "Opp Hyper Price", type: "number" },
  { key: "oppHyperSize", label: "Opp Hyper Size", type: "number" },
  { key: "oppBinancePrice", label: "Opp Binance Price", type: "number" },
  { key: "oppBinanceSize", label: "Opp Binance Size", type: "number" },
  { key: "status", label: "Status", type: "tag" },
];
