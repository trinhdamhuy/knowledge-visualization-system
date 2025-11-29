export type Response<T> = {
  data?: T;
  success: boolean;
  error?: string;
};
