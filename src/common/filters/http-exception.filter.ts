import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : Array.isArray(exceptionResponse?.['message'])
            ? exceptionResponse['message'].join(', ')
            : exceptionResponse?.['message'] || exception.message;

      error =
        typeof exceptionResponse === 'object'
          ? exceptionResponse?.['error'] || exception.name
          : exception.name;
    } else if (exception.name === 'PrismaClientKnownRequestError') {
      switch (exception.code) {
        case 'P2000':
          status = HttpStatus.BAD_REQUEST;
          message = 'Value too long for the field';
          error = 'BadRequest';
          break;

        case 'P2002':
          status = HttpStatus.CONFLICT;
          {
            const target = exception.meta?.target;
            const targetStr = Array.isArray(target)
              ? target.join(', ')
              : target || 'field';
            message = `Duplicate entry: ${targetStr}`;
            error = 'Conflict';
          }
          break;

        case 'P2003':
          status = HttpStatus.CONFLICT;
          message = 'Foreign key constraint failed';
          error = 'Conflict';
          break;

        case 'P2004':
          status = HttpStatus.BAD_REQUEST;
          message = 'Constraint failed';
          error = 'BadRequest';
          break;

        case 'P2005':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid data for field';
          error = 'BadRequest';
          break;

        case 'P2006':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid enum value';
          error = 'BadRequest';
          break;

        case 'P2007':
          status = HttpStatus.BAD_REQUEST;
          message = 'Data validation error';
          error = 'BadRequest';
          break;

        case 'P2016':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Database engine error';
          error = 'InternalServerError';
          break;

        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          error = 'NotFound';
          break;

        case 'P2030':
          status = HttpStatus.BAD_REQUEST;
          message = 'Transaction already closed';
          error = 'BadRequest';
          break;

        case 'P2034':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Inconsistent query results';
          error = 'InternalServerError';
          break;

        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Database error';
          error = 'PrismaError';
          break;
      }
    } else {
      message = exception.message || message;
      error = exception.name || error;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error('Exception:', exception);
    }

    response.status(status).json({
      statusCode: status,
      success: false,
      message,
      error,
    });
  }
}
