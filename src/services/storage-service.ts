import { getFileDownloadUrl, removeFile, uploadFile, type UploadableFile } from "../firebase/storage";

export const storageService = {
  upload(path: string, file: UploadableFile) {
    return uploadFile(path, file);
  },

  download(path: string) {
    return getFileDownloadUrl(path);
  },

  remover(path: string) {
    return removeFile(path);
  },
};
