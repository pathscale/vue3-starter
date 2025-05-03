import type { UserGetPositionResponse } from "~/models/user";
import type { TableColumn } from "~/types";

type PositionsColumnKey = keyof UserGetPositionResponse["data"][0];

export const POSITIONS_TABLE_COLUMNS: TableColumn<PositionsColumnKey>[] = [
  { key: "id", label: "ID", type: "number" },
  { key: "triggerEventId", label: "Trigger Event ID", type: "custom" },
  { key: "timestamp", label: "Timestamp", type: "date" },
  { key: "symbol", label: "Symbol", type: "string" },
  {
    key: "relativePriceIndicator",
    label: "Relative Price Indicator",
    type: "tag",
  },
  { key: "status", label: "Status", type: "tag" },
  { key: "events", label: "Events", type: "custom" },
];
