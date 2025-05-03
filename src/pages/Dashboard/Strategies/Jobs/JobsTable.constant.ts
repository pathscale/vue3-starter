import type { UserListS4JobsResponse } from "~/models/user";
import type { TableColumn } from "~/types";

type JobsColumnKey = keyof UserListS4JobsResponse["data"][0] | "actions";

export const JOBS_TABLE_COLUMNS: TableColumn<JobsColumnKey>[] = [
  { key: "id", label: "ID", type: "number" },
  { key: "isEnabled", label: "Enabled", type: "tag" },
  { key: "leftSymbol", label: "Left Symbol", type: "string" },
  { key: "rightSymbol", label: "Right Symbol", type: "string" },
  { key: "leftExchange", label: "Left Exchange", type: "string" },
  { key: "rightExchange", label: "Right Exchange", type: "string" },
  { key: "leftAmount", label: "Left Amount", type: "number" },
  { key: "rightAmount", label: "Right Amount", type: "number" },
  {
    key: "accumulatedPositionId",
    label: "Accumulated Position ID",
    type: "number",
  },
  {
    key: "rightLivePositionId",
    label: "Right Live Position ID",
    type: "number",
  },
  { key: "leftLivePositionId", label: "Left Live Position ID", type: "number" },
  { key: "actions", label: "Actions", type: "custom" },
];
