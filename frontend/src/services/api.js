import axios from 'axios';

const API = axios.create({
  baseURL: 'https://api.sundigit.in/api/v1',
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

export const API_BASE_URL = 'https://api.sundigit.in/api/v1';

export const gameApi = {
  start: (gameSessionUuid) =>
    API.post('/game/start', { game_session_uuid: gameSessionUuid }),

  progress: (gameSessionUuid, payload) =>
    API.post('/game/progress', { game_session_uuid: gameSessionUuid, ...payload }),

  complete: (gameSessionUuid, payload) =>
    API.post('/game/complete', { game_session_uuid: gameSessionUuid, ...payload }),

  result: (gameSessionUuid) =>
    API.get(`/game/result/${gameSessionUuid}`),

  getStatus: (gameSessionUuid) =>
    API.get(`/game/session/${gameSessionUuid}/status`),
};

export default API;