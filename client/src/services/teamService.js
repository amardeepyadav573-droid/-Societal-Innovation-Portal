import api from "./api";
const teamService = {
  async getTeams() {
    return (await api.get("/teams")).data?.data || { teams: [] };
  },
  async createTeam(data) {
    return (await api.post("/teams", data)).data;
  },
  async updateTeam(id, data) {
    return (await api.patch(`/teams/${id}`, data)).data;
  },
  async deleteTeam(id) {
    return (await api.delete(`/teams/${id}`)).data;
  },
  async getMembers() {
    return (
      (await api.get("/teams/members/candidates")).data?.data || { members: [] }
    );
  },
  async addMember(id, userId) {
    return (await api.post(`/teams/${id}/members`, { userId })).data;
  },
  async removeMember(id, userId) {
    return (await api.delete(`/teams/${id}/members/${userId}`)).data;
  },
};
export default teamService;
