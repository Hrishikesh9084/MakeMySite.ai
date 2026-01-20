import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BASEURL || 'https://make-my-site-ai-backend.vercel.app',
    withCredentials: true,
})

export default api;