import { InternalAxiosRequestConfig } from 'axios';
import cookies from 'js-cookie';

import { JWT_KEY } from '@/components/constants/util';

export const cookieJwtInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = cookies.get(JWT_KEY);

  if (config.headers) {
    config.headers.Authorization = token ? token : '';
  }

  return config;
};
