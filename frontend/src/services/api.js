import axios from 'axios';

const API = axios.create({
  baseURL: 'https://api.sundigit.in/api/v1',
  timeout: 20000, // 20s
  headers: {
    'Accept': 'application/json',
  },
});


API.interceptors.response.use(
  (response) => response,
  (error) => {
    
    if (error.code === 'ECONNABORTED') {
      error.isTimeout = true;
    }
    return Promise.reject(error);
  }
);

export const participantApi = {
 
  register: (formData, config = {}) => {
    return API.post('/participants/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
      ...config,
    });
  },
};

export const API_BASE_URL = 'https://api.sundigit.in/api/v1';

export const gameApi = {
  start: (gameSessionUuid, config = {}) =>
    API.post('/game/start', { game_session_uuid: gameSessionUuid }, config),

  progress: (gameSessionUuid, payload, config = {}) =>
    API.post('/game/progress', { game_session_uuid: gameSessionUuid, ...payload }, config),

  complete: (gameSessionUuid, payload, config = {}) =>
    API.post('/game/complete', { game_session_uuid: gameSessionUuid, ...payload }, config),

  result: (gameSessionUuid, config = {}) =>
    API.get(`/game/result/${gameSessionUuid}`, config),

  getStatus: (gameSessionUuid, config = {}) =>
    API.get(`/game/session/${gameSessionUuid}/status`, config),
};

export default API;