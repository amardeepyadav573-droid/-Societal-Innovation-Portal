import api from "./api";
const organizationService = {
  async save(data) { return (await api.post("/auth/organization", data)).data; }
};
export default organizationService;
