import api from "./api";

const unwrap = (response) => response?.data || {};

const collaborationService = {
  async list(status = "") {
    const response = await api.get("/collaborations", {
      params: status ? { status } : {},
    });
    return unwrap(response)?.data || { requests: [] };
  },
  async discover(type, search = "") {
    const response = await api.get("/collaborations/discover", {
      params: { type, search },
    });
    return unwrap(response)?.data || {};
  },
  async send(targetId, message) {
    const response = await api.post("/collaborations", { targetId, message });
    return unwrap(response);
  },
  async respond(id, status, reason = "") {
    const response = await api.patch(`/collaborations/${id}/respond`, {
      status,
      reason,
    });
    return unwrap(response);
  },
};

export default collaborationService;
