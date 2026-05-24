import api from "./api";

export const adminService = {
  getOverview: async () => (await api.get("/admin/overview")).data,
  getStats: async () => (await api.get("/admin/stats")).data,
  listUsers: async () => (await api.get("/admin/users")).data,
  getUser: async (id) => (await api.get(`/admin/users/${id}`)).data,
  updateUser: async (id, payload) =>
    (await api.patch(`/admin/users/${id}`, payload)).data,
  listPayments: async () => (await api.get("/admin/payments")).data,
  listResumes: async () => (await api.get("/admin/resumes")).data,
  deleteResume: async (id) => (await api.delete(`/admin/resumes/${id}`)).data,
  listActivity: async (limit = 25) =>
    (await api.get(`/admin/activity?limit=${limit}`)).data,
  // jobs
  listJobs: async () => (await api.get("/admin/jobs")).data,
  createJob: async (payload) => (await api.post("/admin/jobs", payload)).data,
  updateJob: async (id, payload) =>
    (await api.patch(`/admin/jobs/${id}`, payload)).data,
  deleteJob: async (id) => (await api.delete(`/admin/jobs/${id}`)).data,
  deleteUser: async (id) => (await api.delete(`/admin/users/${id}`)).data,
  toggleBanUser: async (id) => (await api.patch(`/admin/users/${id}/ban`)).data,
  refundPayment: async (id) =>
    (await api.patch(`/admin/payments/${id}/refund`)).data,
  // support
  listSupportTickets: async () => (await api.get("/admin/support")).data,
  updateSupportTicket: async (id, payload) =>
    (await api.patch(`/admin/support/${id}`, payload)).data,
  deleteSupportTicket: async (id) =>
    (await api.delete(`/admin/support/${id}`)).data,
  // notifications
  listAdminNotifications: async () =>
    (await api.get("/admin/notifications")).data,
  createAdminNotification: async (payload) =>
    (await api.post("/admin/notifications", payload)).data,
  createScheduledAdminNotification: async (payload) =>
    (await api.post("/admin/notifications/schedule", payload)).data,
  listScheduledAdminNotifications: async () =>
    (await api.get("/admin/notifications/scheduled")).data,
  cancelScheduledAdminNotification: async (id) =>
    (await api.patch(`/admin/notifications/scheduled/${id}/cancel`)).data,
  deleteScheduledAdminNotification: async (id) =>
    (await api.delete(`/admin/notifications/scheduled/${id}`)).data,
  retryScheduledAdminNotification: async (id) =>
    (await api.patch(`/admin/notifications/scheduled/${id}/retry`)).data,
  forceDeadLetterScheduledNotification: async (id) =>
    (await api.patch(`/admin/notifications/scheduled/${id}/force-deadletter`))
      .data,
  markNotificationRead: async (id) =>
    (await api.patch(`/admin/notifications/${id}/read`)).data,
  deleteAdminNotification: async (id) =>
    (await api.delete(`/admin/notifications/${id}`)).data,
  // reports
  getReportsSummary: async (range = "30d") =>
    (await api.get(`/admin/reports/summary?range=${range}`)).data,
  listReports: async () => (await api.get("/admin/reports")).data,
  downloadReportsPdf: async (range = "30d") =>
    (
      await api.get(`/admin/reports/pdf?range=${range}`, {
        responseType: "blob",
      })
    ).data,
  getSchedulerStats: async () => (await api.get(`/admin/scheduler/stats`)).data,
};
