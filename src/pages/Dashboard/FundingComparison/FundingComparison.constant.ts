import type { UserGetFundingRateResponse } from "~/models/user";
import type { TableColumn } from "~/types";

type FundingColumnKeyRate = keyof UserGetFundingRateResponse["data"]["rate"][0];
type FundingColumnKeyTop = keyof UserGetFundingRateResponse["data"]["top"][0];

export const FUNDING_TABLE_COLUMNS: TableColumn<FundingColumnKeyRate>[] = [
  { key: "id", label: "ID", type: "number" },
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "exchange", label: "Exchange", type: "string" },
  { key: "rate", label: "Rate", type: "number" },
  { key: "tradingVolume", label: "Trading Volume", type: "number" },
];

export const FUNDING_TABLE_COLUMNS_TOP: TableColumn<FundingColumnKeyTop>[] = [
  { key: "id", label: "ID", type: "number" },
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "exchangeLeft", label: "Exchange Left", type: "string" },
  { key: "exchangeRight", label: "Exchange Right", type: "string" },
  { key: "difference", label: "Difference", type: "number" },
  { key: "volumeLeft", label: "Volume Left", type: "number" },
  { key: "volumeRight", label: "Volume Right", type: "number" },
];
