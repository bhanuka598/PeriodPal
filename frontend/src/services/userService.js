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