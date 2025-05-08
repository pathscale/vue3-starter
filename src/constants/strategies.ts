import { reactive } from "vue";

const STRATEGIES = reactive([
  {
    id: 1,
    name: "Strategy 1",
    description:
      "Description of Strategy 1",
    status: "",
  },
  {
    id: 2,
    name: "Strategy 2",
    description:
      "Description of Strategy 2",
    status: "",
  },
]);

const SUBPAGES = [
  { route: "signals", text: "Signals", show: [1, 2] },
  { route: "orders", text: "Orders", show: [1, 2] },
];

export { STRATEGIES, SUBPAGES };
