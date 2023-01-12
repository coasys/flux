const isSupported = (): boolean => {
  try {
    localStorage.setItem("test", "");
    localStorage.removeItem("test");
  } catch (e) {
    return false;
  }
  return true;
};

const set = (key: string, value: string): void => {
  if (isSupported()) {
    localStorage.setItem(`flux/${key}`, value);
  }
};

const get = (key: string): string | null => {
  if (isSupported()) {
    return localStorage.getItem(`flux/${key}`);
  }
  return null;
};

const remove = (key: string): void => {
  if (isSupported()) {
    localStorage.removeItem(`flux/${key}`);
  }
};

const setForVersion = (key: string, value: string): void => {
  if (isSupported()) {
    localStorage.setItem(`${__APP_VERSION__}/${key}`, value);
  }
};

const getForVersion = (key: string): string | null => {
  if (isSupported()) {
    return localStorage.getItem(`${__APP_VERSION__}/${key}`);
  }
  return null;
};

const removeForVersion = (key: string): void => {
  if (isSupported()) {
    localStorage.removeItem(`${__APP_VERSION__}/${key}`);
  }
};

export {
  isSupported,
  set,
  get,
  remove,
  setForVersion,
  getForVersion,
  removeForVersion,
};
