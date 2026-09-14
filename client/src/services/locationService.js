import api from "./api";

const unwrap = (response) => response?.data || {};

const locationService = {
  getStates: async () => unwrap(await api.get("/locations/states")),
  getDistricts: async (state) =>
    unwrap(await api.get(`/locations/districts/${encodeURIComponent(state)}`)),
  getBlocks: async (state, district) =>
    unwrap(
      await api.get(
        `/locations/blocks/${encodeURIComponent(state)}/${encodeURIComponent(district)}`,
      ),
    ),
  validateLocation: async (state, district, block = "") =>
    unwrap(await api.post("/locations/validate", { state, district, block })),
};

export default locationService;
