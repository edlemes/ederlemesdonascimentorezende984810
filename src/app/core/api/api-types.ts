export type RemoteImage = {
  id?: number
  url?: string
};

export type PaginatedResponse<T> = {
  content?: T[]
  page?: number
  size?: number
  total?: number
  pageCount?: number
};

export type TokenManager = {
  getToken: () => string | null
  setToken: (token: string) => void
  clearToken: () => void
};
