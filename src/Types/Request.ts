export type QueryDefaultResponse<T = unknown> = {
    data: {
      data: {
        user: T
      }
    }
}