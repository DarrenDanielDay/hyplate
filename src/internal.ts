export const __DEV__ = process.env.NODE_ENV === "development";
export const err = (error: unknown) => {
  const msg =
    error instanceof Error
      ? `${
          error.stack
            ? `stack trace: ${error.stack}
`
            : ""
        }`
      : JSON.stringify(error);
  console.error(`[ERROR]: ${msg}`);
};

export const warn = <T extends unknown>(msg: string, value: T) => {
  if (__DEV__) {
    console.warn(msg);
  }
  return value;
};
