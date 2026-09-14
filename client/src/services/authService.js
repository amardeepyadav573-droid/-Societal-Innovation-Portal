import api from "./api";

const authService = {
  sendRegistrationOtp: async (data) => {
    const response = await api.post("/auth/send-registration-otp", data);
    return response.data;
  },

  register: async (data) => {
    const response =
      await api.post(
        "/auth/register",
        data
      );

    return response.data;
  },

  verifyOtp: async (data) => {
    const response =
      await api.post(
        "/auth/verify-otp",
        data
      );

    return response.data;
  },

  resendOtp: async (data) => {
    const response =
      await api.post(
        "/auth/resend-otp",
        data
      );

    return response.data;
  },


  sendPasswordResetOtp: async (data) => {
    const response = await api.post("/auth/send-password-reset-otp", data);
    return response.data;
  },

  verifyPasswordResetOtp: async (data) => {
    const response = await api.post("/auth/verify-password-reset-otp", data);
    return response.data;
  },

  resendPasswordResetOtp: async (data) => {
    const response = await api.post("/auth/resend-password-reset-otp", data);
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  },

  login: async (data) => {
    const response =
      await api.post(
        "/auth/login",
        data
      );

    return response.data;
  },

  getMe: async () => {
    const response =
      await api.get(
        "/auth/me"
      );

    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    try {
      await api.post(
        "/auth/logout"
      );
    } catch (error) {
      // Local logout should continue
      // even if API logout fails.
    }

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );
  },
};

export default authService;