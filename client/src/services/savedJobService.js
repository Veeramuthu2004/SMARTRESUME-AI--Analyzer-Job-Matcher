import api from "./api";

export const savedJobService = {
  saveJob: async (job) => {
    const r = await api.post("/jobs/saved", { job });
    return r.data;
  },
  listSaved: async () => {
    const r = await api.get("/jobs/saved");
    return r.data;
  },
  removeSaved: async (id) => {
    const r = await api.delete(`/jobs/saved/${id}`);
    return r.data;
  },
};
