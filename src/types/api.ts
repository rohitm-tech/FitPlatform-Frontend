export interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}
