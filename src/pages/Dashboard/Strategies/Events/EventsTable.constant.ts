import type {
  UserGetEvent1Response,
  UserGetS2EventResponse,
  UserGetS4EventResponse,
} from "~/models/user";
import type { TableColumn } from "~/types";

type EventColumnKey1 = keyof UserGetEvent1Response["data"][0];
type EventColumnKey2 = keyof UserGetS2EventResponse["data"][0];
type EventColumnKey4 = keyof UserGetS4EventResponse["data"][0];

export const STRATEGY_1_EVENTS_TABLE_COLUMNS: TableColumn<EventColumnKey1>[] = [
  { key: "timestamp", label: "Datetime", type: "date" },
  { key: "id", label: "Event ID", type: "number" },
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "direction", label: "Direction", type: "tag" },
  { key: "opportunityPrice", label: "Opportunity Price", type: "number" },
  {
    key: "originalOpportunitySize",
    label: "Original Opportunity Size",
    type: "number",
  },
  { key: "opportunitySize", label: "Opportunity Size", type: "number" },
  { key: "status", label: "Status", type: "string" },
  { key: "orders", label: "Orders", type: "custom" },
];

export const STRATEGY_2_EVENTS_TABLE_COLUMNS: TableColumn<EventColumnKey2>[] = [
  { key: "id", label: "Event ID", type: "number" },
  { key: "triggerEventId", label: "Trigger Event ID", type: "custom" },
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
  { key: "status", label: "Status", type: "string" },
  { key: "orders", label: "Orders", type: "custom" },
];

export const STRATEGY_3_EVENTS_TABLE_COLUMNS = STRATEGY_2_EVENTS_TABLE_COLUMNS;

export const STRATEGY_4_EVENTS_TABLE_COLUMNS: TableColumn<EventColumnKey4>[] = [
  { key: "id", label: "Event ID", type: "number" },
  { key: "timestamp", label: "Datetime", type: "date" },
  { key: "leftSymbol", label: "Left Symbol", type: "string" },
  { key: "rightSymbol", label: "Right Symbol", type: "string" },
  { key: "leftCancel", label: "Left Cancel", type: "string" },
  { key: "leftQuantity", label: "Left Quantity", type: "number" },
  { key: "leftEventType", label: "Left Event Type", type: "string" },
  { key: "leftAdjustedPrice", label: "Left Adjusted Price", type: "number" },
  { key: "leftPositionDiff", label: "Left Position Diff", type: "number" },
  { key: "rightCancel", label: "Right Cancel", type: "string" },
  { key: "rightQuantity", label: "Right Quantity", type: "number" },
  { key: "rightEventType", label: "Right Event Type", type: "string" },
  { key: "rightAdjustedPrice", label: "Right Adjusted Price", type: "number" },
  { key: "rightPositionDiff", label: "Right Position Diff", type: "number" },
];
