import axios from 'axios';

const api = axios.create({
  // TODO maybe put this in an env
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
