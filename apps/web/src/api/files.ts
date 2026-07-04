import http from './http';

export const filesApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
