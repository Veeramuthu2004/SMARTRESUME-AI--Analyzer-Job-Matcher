import api from "./api";

export const settingsService = {
  getPublicSettings: async () => (await api.get("/settings/public")).data,
  getSettings: async () => (await api.get("/settings")).data,
  updateSettings: async (payload) => (await api.put("/settings", payload)).data,
  updateMaintenance: async (payload) =>
    (await api.patch("/settings/maintenance", payload)).data,
};
