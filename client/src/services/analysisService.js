import api from "./api";

export const analysisService = {
  analyze: async (payload) => (await api.post("/analyses", payload)).data,
  list: async (page = 1, limit = 10) =>
    (await api.get("/analyses", { params: { page, limit } })).data,
  listCached: async (page = 1, limit = 10) =>
    (await api.get("/analyses", { params: { page, limit, cached: true } }))
      .data,
  getById: async (id) => (await api.get(`/analyses/${id}`)).data,
  delete: async (id) => (await api.delete(`/analyses/${id}`)).data,
  dashboard: async () => (await api.get("/dashboard")).data,
  exportPdf: async (id) => {
    const response = await api.get(`/analyses/${id}/export/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },
};
