import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Operation successful',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  code?: string,
  errors?: Record<string, string[]>
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    code,
    errors,
  });
};

