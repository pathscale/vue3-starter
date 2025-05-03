// declare module '@pathscale/vue3-ui'
declare module "*.svg" {}

type RecordType = Record<string, boolean | string>;

export interface TableColumn<T> {
  key: T;
  label: string;
  type: "number" | "string" | "date" | "custom" | "object" | "tag";
}
