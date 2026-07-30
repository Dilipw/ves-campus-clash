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

export const gameApi = {
  start: (participantUuid) => {
    return API.post('/game/start', { participant_uuid: participantUuid });
  },

  progress: (gameSessionUuid, payload) => {
    return API.post('/game/progress', {
      game_session_uuid: gameSessionUuid,
      ...payload,
    });
  },

  complete: (gameSessionUuid, payload) => {
    return API.post('/game/complete', {
      game_session_uuid: gameSessionUuid,
      ...payload,
    });
  },

  result: (gameSessionUuid) => {
    return API.get(`/game/result/${gameSessionUuid}`);
  },

  getStatus: (gameSessionUuid) => {
    return API.get(`/game/session/${gameSessionUuid}/status`);
  },
};

export default API;