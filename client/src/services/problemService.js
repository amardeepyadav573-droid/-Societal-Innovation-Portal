import api from "./api";

const unwrap = (response) => response?.data || {};

const problemService = {
  getProblems: async (params = {}) => {
    const response = await api.get("/problems", { params });
    const data = unwrap(response);

    return {
      ...data,
      problems: data?.data?.problems || data?.problems || [],
      pagination: data?.data?.pagination || data?.pagination || {},
    };
  },

  getAssignedProblems: async () => {
    const response = await api.get("/dashboard/university");
    const data = unwrap(response);
    const dashboard = data?.data || {};

    return {
      ...data,
      problems: Array.isArray(dashboard.recentChallenges)
        ? dashboard.recentChallenges
        : [],
      university: dashboard.university || null,
      stats: dashboard.stats || {},
    };
  },

  myProblems: async (params = {}) => {
    const response = await api.get("/problems", { params });
    const data = unwrap(response);

    return {
      ...data,
      problems: data?.data?.problems || data?.problems || [],
      pagination: data?.data?.pagination || data?.pagination || {},
    };
  },

  getById: async (id) => {
    if (!id) throw new Error("Challenge ID is required");

    const response = await api.get(
      `/problems/${encodeURIComponent(String(id))}`,
    );

    return unwrap(response);
  },

  getProblemById: async (id) => {
    if (!id) throw new Error("Challenge ID is required");

    const response = await api.get(
      `/problems/${encodeURIComponent(String(id))}`,
    );

    return unwrap(response);
  },

  createProblem: async (payload = {}) => {
    let body;

    if (payload instanceof FormData) {
      body = payload;
    } else {
      body = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        if (key === "evidence") return;

        if (key === "location") {
          const locationValue =
            typeof value === "string" ? value : JSON.stringify(value || {});
          body.append("location", locationValue);
          return;
        }

        if (value !== undefined && value !== null) {
          body.append(key, String(value));
        }
      });

      if (Array.isArray(payload.evidence)) {
        payload.evidence.forEach((file) => {
          if (file instanceof File) {
            body.append("evidence", file);
          }
        });
      }
    }

    const response = await api.post("/problems", body);

    return unwrap(response);
  },

  create: async (payload) => problemService.createProblem(payload),

  updateProblemStatus: async (id, status, rejectionReason = "") => {
    const body =
      typeof status === "object" ? status : { status, rejectionReason };

    const response = await api.patch(
      `/problems/${encodeURIComponent(String(id))}/status`,
      body,
    );

    return unwrap(response);
  },

  updateStatus: async (id, status, rejectionReason = "") =>
    problemService.updateProblemStatus(id, status, rejectionReason),

  assignProblem: async (id, universityId) => {
    const response = await api.patch(
      `/problems/${encodeURIComponent(String(id))}/assign`,
      { universityId },
    );

    return unwrap(response);
  },

  assign: async (id, universityId) =>
    problemService.assignProblem(id, universityId),

  acceptProblem: async (id) => {
    const response = await api.patch(
      `/problems/${encodeURIComponent(String(id))}/accept`,
    );

    return unwrap(response);
  },

  accept: async (id) => problemService.acceptProblem(id),

  createProjectFromProblem: async (id) => {
    const response = await api.post(
      `/problems/${encodeURIComponent(String(id))}/create-project`,
    );

    return unwrap(response);
  },

  createProject: async (id) => problemService.createProjectFromProblem(id),

  getIndustryOpportunities: async () => {
    const response = await api.get("/problems/industry/opportunities");
    const data = unwrap(response);

    return {
      ...data,
      problems: data?.data?.problems || data?.problems || [],
    };
  },

  industryOpportunities: async () => problemService.getIndustryOpportunities(),

  deleteProblem: async (id) => {
    const response = await api.delete(
      `/problems/${encodeURIComponent(String(id))}`,
    );

    return unwrap(response);
  },

  delete: async (id) => problemService.deleteProblem(id),
};

export const createProblem = problemService.createProblem;
export const getProblems = problemService.getProblems;
export const myProblems = problemService.myProblems;
export const getProblemById = problemService.getProblemById;

export default problemService;
