import api from "./api";

export const jobDescriptionService = {
  // Accept search string and optional filters: { role, skills, location }
  search: async (q, filters = {}) =>
    (
      await api.get("/job-descriptions/search", {
        params: { q, ...filters },
      })
    ).data,
};
