import api from "./api";

const analyticsService = {
  async getDashboard() {
    const response = await api.get(
      "/analytics/dashboard"
    );

    return response.data;
  }
};

export default analyticsService;