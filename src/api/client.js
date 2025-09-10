// import axios from 'axios';
import config from '../config';
import { getToken, setToken } from '../storage';

import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ReactNativeSSLPinning, fetch as sslFetch } from 'react-native-ssl-pinning'
const insecureAdapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    const response = await sslFetch(config.baseURL+config.url, {
        method: config.method?.toUpperCase() as ReactNativeSSLPinning.Options['method'],
        sslPinning: { certs: [] },
        disableAllSecurity: true,
        timeoutInterval: config.timeout,
        headers: config.headers as ReactNativeSSLPinning.Options['headers'],
        body: config.data,
    })

    return {
        data: await response.json(),
        status: response.status,
        statusText: '',
        headers: response.headers,
        config: config as InternalAxiosRequestConfig,
    }
}

// Create an axios instance with default configuration
console.log('apiUrl', config.apiUrl);
console.log('apiKey', config.apiKey);
console.log('adapter', insecureAdapter);
const api = axios.create({ 
  baseURL: config.apiUrl, 
  adapter: insecureAdapter,
  withCredentials: true,
  timeout: 10000,
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
    console.log('API Error:', error.response?.data || error.message);
    console.log('API Error Status:', error.response?.status);
    console.log('API Error Config:', error.config);
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  },
);

export async function getMemories() {
  try {
    // const response = await axios.get('https://206.12.92.174:5000/memories', {
    //   headers: {
    //     'Accept': 'application/json'
    //   },
    //   // In React Native, SSL certificate validation is handled differently
    //   // You may need to configure your app to allow self-signed certificates
    //   timeout: 10000, // 10 second timeout
    // });
    // const response = await api.get(config.apiUrl+'/memories', {
    //   headers: {
    //     'Accept': 'application/json'
    //   },
    //   timeout: 10000,
    // });
    //   Test 1: Check what URLs are being constructed
      console.log('Config apiUrl:', config.apiUrl);
      console.log('Axios baseURL:', api.defaults.baseURL);
      
      // Test 2: Try the working version first
      console.log('Testing full URL approach...');
      const response = await api.get('/memories');
      // console.log('Full URL works:', fullResponse);
      
      // Test 3: Now try with instance
    //   console.log('Testing instance approach...');
    //   const instanceResponse = await api.get('/memories');
    //   console.log('Instance works:', instanceResponse);
    // // console.log("response", response)
    console.log("response type", typeof response, "is array", Array.isArray(response), "array length", response.length)

    // // Format the response for display
    // const formattedResponse = typeof response.data === 'object' 
    //   ? JSON.stringify(response.data, null, 2)
    //   : response.data;

    // // Format the response for display
    // const formattedResponse = typeof response.data === 'object' 
    //   ? JSON.stringify(response.data, null, 2)
    //   : response.data;
    // console.log("formated response", formattedResponse)

    return response;
    
  } catch (err) {
    const errorMessage = err.message || 'Unknown error occurred';
    // setError(errorMessage);
    // Alert.alert('Request Failed', errorMessage);
    console.log("error in getting memory", err)
    return errorMessage;
  } 
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
