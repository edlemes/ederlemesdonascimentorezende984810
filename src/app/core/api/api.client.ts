import { api, tokenManager } from './http.service';
import { API_ENDPOINTS } from './api.endpoints';

export const httpClient = {
  get: api.get.bind(api),
  post: api.post.bind(api),
  put: api.put.bind(api),
  delete: api.delete.bind(api),
  patch: api.patch.bind(api),
};

export { tokenManager, API_ENDPOINTS };