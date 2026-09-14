import api from "./api";
const unwrap = (r) => r?.data?.data || r?.data || {};
const notificationService = {
  async list() {
    return unwrap(await api.get("/notifications"));
  },
  async markRead(id) {
    return unwrap(await api.patch(`/notifications/${id}/read`));
  },
  async markAllRead() {
    return unwrap(await api.patch("/notifications/read-all"));
  },
  async remove(id) {
    return unwrap(await api.delete(`/notifications/${id}`));
  },
};
export default notificationService;
