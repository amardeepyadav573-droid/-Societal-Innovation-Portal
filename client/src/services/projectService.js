import api from "./api";
const projectService = {
  async getProjects(params = {}) {
    return (
      (await api.get("/projects", { params })).data?.data || { projects: [] }
    );
  },
  async getProject(id) {
    return (await api.get(`/projects/${id}`)).data?.data || {};
  },
  async updateProject(id, data) {
    return (await api.patch(`/projects/${id}`, data)).data;
  },
  async updateMilestone(id, milestoneId, data) {
    return (await api.patch(`/projects/${id}/milestones/${milestoneId}`, data))
      .data;
  },
  async submitProposal(id, data) {
    return (await api.post(`/projects/${id}/proposal`, data)).data;
  },
  async reviewProposal(id, status) {
    return (await api.patch(`/projects/${id}/proposal/review`, { status }))
      .data;
  },
  async requestCollaboration(id, message) {
    return (await api.post(`/projects/${id}/collaboration`, { message })).data;
  },
  async respondCollaboration(id, requestId, status) {
    return (
      await api.patch(`/projects/${id}/collaboration/${requestId}`, { status })
    ).data;
  },
};
export default projectService;
