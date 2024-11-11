export interface CustomError extends Error {
  data?: Object;
  status?: number;
}
