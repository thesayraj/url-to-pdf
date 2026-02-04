import axios from "axios";
import { config } from "../config";

const API = axios.create({
  baseURL: config.apiBaseUrl,
  // timeout: 60000,
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API error:", err.response?.data || err.message);
    return Promise.reject(err);
  },
);

export default API;
