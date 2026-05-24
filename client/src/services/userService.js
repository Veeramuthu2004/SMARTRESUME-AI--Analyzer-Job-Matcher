import api from "./api";

export const userService = {
  updateProfile: async (payload) =>
    (await api.put("/users/profile", payload)).data,
  uploadAvatar: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return (
      await api.post("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      })
    ).data;
  },
  updatePreferences: async (payload) =>
    (await api.put("/users/preferences", payload)).data,
  deleteAccount: async (payload) =>
    (await api.delete("/users/account", { data: payload })).data,
  getNotifications: async () => (await api.get("/users/notifications")).data,
};
