import { HttpInterceptorFn } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';
let pending = 0;
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  pending++;
  return next(req).pipe(
    tap({}),
    finalize(() => { pending--; })
  );
};
