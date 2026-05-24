import { useEffect } from "react";
import { onAppRefresh } from "../lib/appEvents";

export const useAppRefresh = (callback) => {
  useEffect(() => {
    if (typeof callback !== "function") return undefined;
    return onAppRefresh(callback);
  }, [callback]);
};
