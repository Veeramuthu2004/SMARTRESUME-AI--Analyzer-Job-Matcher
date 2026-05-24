const APP_REFRESH_EVENT = "sra:data-refresh";

export const emitAppRefresh = (detail = {}) => {
  window.dispatchEvent(new CustomEvent(APP_REFRESH_EVENT, { detail }));
};

export const onAppRefresh = (handler) => {
  window.addEventListener(APP_REFRESH_EVENT, handler);
  return () => window.removeEventListener(APP_REFRESH_EVENT, handler);
};
