export const useDocumentClear = () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });
};

export const useConsoleSpy = () => {
  let error: jest.SpyInstance, warn: jest.SpyInstance;
  beforeEach(() => {
    warn = import.meta.jest.spyOn(console, "warn");
    warn.mockImplementation(() => {});
    error = import.meta.jest.spyOn(console, "error");
    error.mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockReset();
    warn.mockRestore();
    error.mockReset();
    error.mockRestore();
  });
  return {
    get error() {
      return error;
    },
    get warn() {
      return warn;
    },
  };
};
