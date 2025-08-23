import axios from 'axios';
import config from '../config';
import { getToken, setToken } from '../storage';

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
});

api.interceptors.request.use(async (cfg) => {
  const token = await getToken();
  cfg.headers = {
    ...cfg.headers,
    Accept: 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
  };
  if (token) cfg.headers.Cookie = token;
  return cfg;
});

// Centralized response parsing and error handling
api.interceptors.response.use(
  async (response) => {
    const cookie = response.headers['set-cookie'];
    if (cookie) {
      await setToken(Array.isArray(cookie) ? cookie[0] : cookie);
    }
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  },
);

export function getMemories() {
  return api.get('/memories');
}

function upload(endpoint, file, name) {
  const data = new FormData();
  data.append('file', file);
  if (name) data.append('name', name);
  return api.post(endpoint, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function uploadText(file, name) {
  return upload('/upload_text', file, name);
}

export function uploadAudio(file, name) {
  return upload('/upload_audio', file, name);
}

export function uploadImage(file, name) {
  return upload('/upload_image', file, name);
}

export function uploadVideo(file, name) {
  return upload('/upload_video', file, name);
}

export function renameMemory(id, newName) {
  const data = new URLSearchParams({ new_name: newName });
  return api.post(`/api/rename/${id}`, data);
}

export function deleteMemory(id) {
  return api.post(`/api/delete/${id}`);
}

export function estateChat(data) {
  const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
  return api.post('/estate_chat', data, { headers });
}

export function chat(memId, data) {
  const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
  return api.post(`/chat/${memId}`, data, { headers });
}

export function getHouses(params) {
  return api.get('/housing', { params });
}

export function getHouse(index) {
  return api.get(`/housing/${index}`);
}

export function getEstateRecommendation() {
  return api.get('/estate_recommendation');
}

export function tts(text) {
  const data = new URLSearchParams({ text });
  return api.post('/tts', data);
}

export default api;
