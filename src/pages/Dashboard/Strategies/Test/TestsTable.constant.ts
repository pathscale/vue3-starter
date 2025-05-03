export const TESTS_TABLE_COLUMNS = [
  { key: "datetime", label: "Datetime", type: "number" },
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "targetPrice", label: "Target Price", type: "number" },
  { key: "trendPrediction", label: "Trend Prediction", type: "string" },
  { key: "priceEvent", label: "Price Event", type: "number" },
  { key: "priceActualFilled", label: "Price Actual Filled", type: "number" },
  {
    key: "priceMarketWhenFilled",
    label: "Price Market When Filled",
    type: "number",
  },
  { key: "passActualFilled", label: "Pass Actual Filled", type: "boolean" },
  {
    key: "passMarketWhenFilled",
    label: "Pass Market When Filled",
    type: "boolean",
  },
  { key: "lastOpenPrice", label: "Last Open Price", type: "number" },
  { key: "lastClosePrice", label: "Last Close Price", type: "number" },
  { key: "lastHighPrice", label: "Last High Price", type: "number" },
  { key: "lastLowPrice", label: "Last Low Price", type: "number" },
];
