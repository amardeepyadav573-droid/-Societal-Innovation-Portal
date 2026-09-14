import api from "./api";

const get = async (path) => (await api.get(path)).data;

const dashboardService = {
  getGovernmentDashboard: () => get("/dashboard/government"),
  getUniversityDashboard: () => get("/dashboard/university"),
  getIndustryDashboard: () => get("/dashboard/industry"),
  getCitizenDashboard: () => get("/dashboard/citizen"),
  getPublicStatistics: () => get("/dashboard/public-stats"),
};
export default dashboardService;
