import { reactive } from "vue";

const STRATEGIES = reactive([
  {
    id: 1,
    name: "Strategy 1",
    description:
      "This strategy uses a combination of technical analysis and fundamental analysis to make trading decisions.",
    status: "",
  },
  {
    id: 2,
    name: "Strategy 2",
    description:
      "This strategy uses algorithmic trading to execute trades based on complex mathematical models and market data analysis.",
    status: "",
  },
  {
    id: 3,
    name: "Strategy 3",
    description:
      "This strategy focuses on momentum trading, aiming to capitalize on the continuance of existing trends in the market.",
    status: "",
  },
  {
    id: 4,
    name: "Strategy 4",
    description:
      "This strategy uses a combination of technical analysis and fundamental analysis to make trading decisions.",
  },
]);

const SUBPAGES = [
  { route: "signals", text: "Signals", show: [1, 2, 3, 4] },
  {
    route: "events",
    text: "Events",
    show: [1, 2, 3, 4],
  },
  {
    route: "eventDebug",
    text: "Events Debug",
    show: [1, 2, 3, 4],
  },
  { route: "orders", text: "Orders", show: [1, 2, 3, 4] },
  { route: "ledger", text: "Ledger", show: [1, 2, 3, 4] },
  { route: "slippage", text: "Slippage", show: [1, 2, 3] },
  { route: "livePosition", text: "Live Position", show: [1, 2, 3, 4] },
  { route: "positions", text: "Hedged Positions", show: [2, 3] },
  { route: "config", text: "Config", show: [4] },
  { route: "jobs", text: "Jobs", show: [4] },
];

export { STRATEGIES, SUBPAGES };
