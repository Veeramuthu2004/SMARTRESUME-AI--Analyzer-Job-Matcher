import api from "./api";

export const jobsService = {
  searchJobs: async (params) => {
    const r = await api.get("/jobs/search", { params });
    return r.data;
  },
  matchJob: async ({ resumeId, jobText }) => {
    const r = await api.post("/job-descriptions/match", { resumeId, jobText });
    return r.data;
  },
};
