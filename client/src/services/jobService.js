import api from "./api";

export const jobService = {
  match: async ({ resumeId, resumeText, jobText, roleTitle }) =>
    (
      await api.post("/job-descriptions/match", {
        resumeId,
        resumeText,
        jobText,
        roleTitle,
      })
    ).data,
};

export default jobService;
