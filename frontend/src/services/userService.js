import API from "../api/axios";

// Auth
export const loginUser = async (data) => {
  return await API.post("/users/login", data);
};

export const registerUser = async (data) => {
  return await API.post("/users/register", data);
};

// Profile
export const getUserProfile = async () => {
  return await API.get("/users/profile/");
};

export const updateUserProfile = async (id, data) => {
  return await API.put(`/users/profile/${id}`, data);
};

// Admin user management
export const getAllUsers = async () => {
  return await API.get("/users/");
};

export const updateUserByAdmin = async (id, data) => {
  return await API.put(`/users/${id}`, data);
};

export const deleteUserByAdmin = async (id) => {
  return await API.delete(`/users/${id}`);
};

// Google OAuth
export const googleOAuthCallback = async (code) => {
  return await API.post("/users/auth/google", { code });
};

// OTP / Email Verification
export const sendOTP = async (email, purpose = 'registration') => {
  return await API.post("/otp/send", { email, purpose });
};

export const verifyOTP = async (email, otp, purpose = 'registration') => {
  return await API.post("/otp/verify", { email, otp, purpose });
};

export const resendOTP = async (email, purpose = 'registration') => {
  return await API.post("/otp/resend", { email, purpose });
};

export const checkEmailVerified = async (email, purpose = 'registration') => {
  return await API.post("/otp/check-verified", { email, purpose });
};

// Forgot Password
export const requestPasswordReset = async (email) => {
  return await API.post("/auth/forgot-password", { email });
};

export const verifyResetOTP = async (email, otp) => {
  return await API.post("/auth/verify-reset-otp", { email, otp });
};

export const resetPassword = async (email, otp, newPassword) => {
  return await API.post("/auth/reset-password", { email, otp, newPassword });
};