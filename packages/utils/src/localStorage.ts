export const isSupported = (): boolean => {
  try {
    localStorage.setItem("test", "");
    localStorage.removeItem("test");
  } catch (e) {
    return false;
  }
  return true;
};

export const set = (key: string, value: string): void => {
  if (isSupported()) {
    localStorage.setItem(`flux/${key}`, value);
  }
};

export const get = (key: string): string | null => {
  if (isSupported()) {
    return localStorage.getItem(`flux/${key}`);
  }
  return null;
};

export const remove = (key: string): void => {
  if (isSupported()) {
    localStorage.removeItem(`flux/${key}`);
  }
};

export const setForVersion = (key: string, value: string): void => {
  if (isSupported()) {
    localStorage.setItem(`${__APP_VERSION__}/${key}`, value);
  }
};

export const getForVersion = (key: string): string | null => {
  if (isSupported()) {
    return localStorage.getItem(`${__APP_VERSION__}/${key}`);
  }
  return null;
};

export const removeForVersion = (key: string): void => {
  if (isSupported()) {
    localStorage.removeItem(`${__APP_VERSION__}/${key}`);
  }
};
