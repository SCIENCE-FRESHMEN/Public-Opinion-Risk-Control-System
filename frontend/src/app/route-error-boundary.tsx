import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

function getErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '应用在加载过程中遇到未预期错误。';
}

export function RouteErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-6 text-[var(--color-on-surface)]">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(29,32,38,0.98),rgba(16,19,26,0.98))] p-10 shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
        <div className="font-label text-[11px] uppercase tracking-[0.22em] text-[var(--color-secondary)]">系统异常</div>
        <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.04em] text-white">情绪风险研判台载入失败</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-on-surface-variant)]">
          页面未能正常完成初始化。已拦截默认路由报错屏，保留当前视觉基调，便于继续定位问题。
        </p>
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-black/20 px-5 py-4">
          <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">错误详情</div>
          <div className="mt-2 text-sm text-[var(--color-error)]">{getErrorMessage(error)}</div>
        </div>
      </div>
    </div>
  );
}
