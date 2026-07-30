import axios from 'axios';

// Adjust baseURL according to your Laravel local/production URL
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Accept': 'application/json',
  },
});

export const participantApi = {
  register: (formData) => {
    return API.post('/participants/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default API;