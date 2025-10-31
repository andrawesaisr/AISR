export const getErrorMessage = (error: any, fallback = 'Something went wrong') => {
  if (error?.response?.data?.message) {
    return error.response.data.message as string;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return fallback;
};

