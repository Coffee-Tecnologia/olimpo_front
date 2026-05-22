import { JWT_KEY } from '@/Components/constants/util';
import { InternalAxiosRequestConfig } from 'axios';
import cookies from 'js-cookie';

export const cookieJwtInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = cookies.get(JWT_KEY);

  if (config.headers) {
    config.headers.Authorization = token ? token : '';
  }

  return config;
};
