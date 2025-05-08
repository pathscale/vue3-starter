import { defineStore } from "pinia";
import type { LoginResponse } from "~/mutations";
import Role from "~/utils/roles.enum";

export interface IAccount extends LoginResponse {
  role: Role;
}

const useGlobalStore = defineStore("global", {
  state: () => ({
    account: JSON.parse(localStorage.getItem("account") ?? "{}") as IAccount,
    isConnected: false,
  }),
  getters: {
    isUser({ account }) {
      return account.role === Role.User;
    },
    isAdmin({ account }) {
      return account.role === Role.Admin;
    },
  },
  actions: {
    setRole(role: Role) {
      this.account.role = role;
    },
    setAccount(account: IAccount) {
      this.account = account;
    },
    setIsConnected(value: boolean) {
      this.isConnected = value;
    },
  },
});

export default useGlobalStore;
