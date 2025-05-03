import type {
  UserGetOrder1Response,
  UserGetS2OrderResponse,
} from "~/models/user";
import type { TableColumn } from "~/types";

type OrderColumnKey1 = keyof UserGetOrder1Response["data"][0];
type OrderColumnKey2 = keyof UserGetS2OrderResponse["data"][0];

export const STRATEGY_1_ORDERS_TABLE_COLUMNS: TableColumn<OrderColumnKey1>[] = [
  { key: "timestamp", label: "Datetime", type: "date" },
  { key: "id", label: "ID", type: "string" },
  { key: "eventId", label: "Event ID", type: "custom" },
  { key: "orderType", label: "Order Type", type: "tag" },
  { key: "orderRole", label: "Order Role", type: "string" },
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "price", label: "Price", type: "number" },
  { key: "averageFilledPrice", label: "Average Filled Price", type: "number" },
  { key: "size", label: "Size", type: "number" },
  { key: "filled", label: "Filled", type: "number" },
  { key: "status", label: "Status", type: "tag" },
];

export const STRATEGY_2_ORDERS_TABLE_COLUMNS: TableColumn<OrderColumnKey2>[] = [
  { key: "id", label: "ID", type: "number" },
  { key: "strategy", label: "Strategy", type: "string" },
  { key: "exchange", label: "Exchange", type: "string" },
  { key: "timestamp", label: "Datetime", type: "date" },
  // { key: 'cloid', label: 'Cloid', type: 'string' },
  { key: "triggerEventId", label: "Trigger Event ID", type: "custom" },
  { key: "eventId", label: "Event ID", type: "custom" },
  { key: "orderType", label: "Order Type", type: "tag" },
  { key: "status", label: "Status", type: "tag" },
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "size", label: "Size", type: "number" },
  { key: "price", label: "Price", type: "number" },
  { key: "filledSize", label: "Filled Size", type: "number" },
  { key: "averageFilledPrice", label: "Average Filled Price", type: "number" },
  { key: "fee", label: "Fee", type: "number" },
];
