import type { UserGetComplexSignal1Response } from "~/models/user";
import type { TableColumn } from "~/types";

type SignalColumnKey1 = keyof UserGetComplexSignal1Response["data"][0];

export const STRATEGY_1_COMPLEX_SIGNALS_TABLE_COLUMNS: TableColumn<SignalColumnKey1>[] =
  [
    { key: "timestamp", label: "Timestamp", type: "date" },
    { key: "symbol", label: "Symbol", type: "string" },
    { key: "movements", label: "Movements", type: "number" },
    {
      key: "binanceHlMovement500",
      label: "Binance-HL Movement 500",
      type: "number",
    },
    {
      key: "binanceHlMovement1000",
      label: "Binance-HL Movement 1000",
      type: "number",
    },
    {
      key: "binanceHlMovement3000",
      label: "Binance-HL Movement 3000",
      type: "number",
    },
    {
      key: "binanceHlMovement5000",
      label: "Binance-HL Movement 5000",
      type: "number",
    },
    {
      key: "binanceHlMovement10000",
      label: "Binance-HL Movement 10000",
      type: "number",
    },
  ];
