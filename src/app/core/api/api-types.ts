export type RemoteImage = {
  url?: string
}

export type PaginatedResponse<T> = {
  content?: T[]
  page?: number
  size?: number
  total?: number
  pageCount?: number
}
