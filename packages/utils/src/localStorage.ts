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

export const setForVersion = (
  version: string,
  key: string,
  value: string
): void => {
  if (isSupported()) {
    localStorage.setItem(`${version}/${key}`, value);
  }
};

export const getForVersion = (version: string, key: string): string | null => {
  if (isSupported()) {
    return localStorage.getItem(`${version}/${key}`);
  }
  return null;
};

export const removeForVersion = (version: string, key: string): void => {
  if (isSupported()) {
    localStorage.removeItem(`${version}/${key}`);
  }
};
