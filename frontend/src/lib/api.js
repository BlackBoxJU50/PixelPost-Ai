import axios from 'axios';
import { auth } from '../firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const instance = axios.create({ baseURL: `${BASE_URL}/api` });

// Attach Firebase token to every request
instance.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap response data
instance.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

const api = {
  get: (path, params) => instance.get(path, { params }),
  post: (path, data) => instance.post(path, data),
  patch: (path, data) => instance.patch(path, data),
  delete: (path) => instance.delete(path),
  upload: (path, formData) =>
    instance.post(path, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;
