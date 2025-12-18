import Cookies from "js-cookie";
import type { PersistStorage } from "zustand/middleware";

export function createCookieStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name) => {
      const value = Cookies.get(name);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      Cookies.set(name, JSON.stringify(value), { expires: 7, sameSite: "lax" });
    },
    removeItem: (name) => {
      Cookies.remove(name);
    },
  };
}

export const cookieStorage = createCookieStorage();
