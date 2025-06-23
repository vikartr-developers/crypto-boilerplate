import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();

        const res: any = {
          statusCode: response.statusCode,
          success: true,
          message: data?.message || 'Request successful',
          data: data?.data ?? [],
        };

        if (data?.pagination) {
          res.pagination = data.pagination;   
        }

        return res;
      }),
    );
  }
}
