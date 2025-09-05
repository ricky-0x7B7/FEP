import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5001'; // Using exact IP instead of localhost

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Increase timeout for file uploads
  timeout: 60000 // 60 seconds
});

// Export the api instance and base URL for direct use
export { api, API_BASE };

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error status
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({ error: 'No response from server' });
    } else {
      // Other errors
      return Promise.reject({ error: 'Request failed' });
    }
  }
);

export function login(username, password) {
  return api.post('/login', { 
    username, 
    password 
  });
}

export function getMissions() {
  return api.get('/missions');
}

export function getChildren(queryParams = '') {
  return api.get(`/children${queryParams}`);
}

export function getNews() {
  return api.get('/news');
}

// Translation API functions
export function translateText(text, targetLanguage, sourceLanguage = 'auto') {
  return api.post('/translate', {
    text,
    target_lang: targetLanguage,
    source_lang: sourceLanguage
  });
}

export function translateField(params) {
  return api.post('/translate/field', params);
}

export function getTranslationStats() {
  return api.get('/translate/stats');
}
