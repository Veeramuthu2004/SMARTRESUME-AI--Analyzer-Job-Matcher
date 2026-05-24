import api from "./api";

export const resumeService = {
  uploadResume: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("resume", file);
    return (await api.post("/resumes/upload", formData, { onUploadProgress }))
      .data;
  },
  listResumes: async () =>
    (
      await api.get("/resumes", {
        params: { _ts: Date.now() },
      })
    ).data,
  getById: async (id) =>
    (
      await api.get(`/resumes/${id}`, {
        params: { _ts: Date.now() },
      })
    ).data,
  delete: async (id) => (await api.delete(`/resumes/${id}`)).data,
};
