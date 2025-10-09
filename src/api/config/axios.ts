import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';

import { cookieJwtInterceptor } from './cookieJwtInterceptor';

const DEFAULT_TIMEOUT = '10000';

export interface ApiError {
  status: number;
  message: string;
}

const API_SUFIXO = '/api';

const VERSION_SUFIXO = '/v1';

const api = applyCaseMiddleware(
  axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}${API_SUFIXO}${VERSION_SUFIXO}`,
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT ?? DEFAULT_TIMEOUT),
  }),
);

//coloca o JWT na request
api.interceptors.request.use(cookieJwtInterceptor);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        window.location.href = '/error/403';
      }
    }
    return Promise.reject(error);
  },
);

export const ApiService = (path: string) => {
  const get = async <T>(url: string, config = {}) => {
    return (await api.get<T>(`${path}${url}`, config)).data;
  };

  const post = async <T>(url: string, data: T, config = {}) => {
    return (await api.post<T>(`${path}${url}`, data, config)).data;
  };

  const put = async <T>(url: string, data: T, config = {}) => {
    return (await api.put<T>(`${path}${url}`, data, config)).data;
  };

  const patch = async <T, D>(url: string, data?: D, config = {}) => {
    return (await api.patch<T>(`${path}${url}`, data, config)).data;
  };

  const remove = async <T>(url: string, config = {}) => {
    return (await api.delete<T>(`${path}${url}`, config)).data;
  };

  return {
    get,
    post,
    put,
    patch,
    remove,
  };
};
