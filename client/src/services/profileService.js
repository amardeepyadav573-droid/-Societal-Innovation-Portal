import api from "./api";

const profileService = {
  getCitizenProfile: async () => (await api.get("/profiles/citizen")).data,
  updateCitizenProfile: async (formData) =>
    (await api.put("/profiles/citizen", formData)).data,
  getUniversityProfile: async () =>
    (await api.get("/profiles/university")).data,
  updateUniversityProfile: async (formData) =>
    (await api.put("/profiles/university", formData)).data,
  getIndustryProfile: async () => (await api.get("/profiles/industry")).data,
  updateIndustryProfile: async (formData) =>
    (await api.put("/profiles/industry", formData)).data,
};

export default profileService;
