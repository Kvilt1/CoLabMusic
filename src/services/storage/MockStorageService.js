import { StorageService } from './StorageService';

/**
 * Mock implementation of StorageService for testing
 */
export class MockStorageService extends StorageService {
  constructor() {
    super();
    this.mockFiles = {};
    this.mockErrors = {};
  }

  /**
   * Set mock error for testing
   * @param {string} method
   * @param {Error} error
   */
  setError(method, error) {
    this.mockErrors[method] = error;
  }

  /**
   * Clear mock error
   * @param {string} method
   */
  clearError(method) {
    delete this.mockErrors[method];
  }

  /**
   * Get all uploaded files for testing
   * @returns {Object}
   */
  getMockFiles() {
    return this.mockFiles;
  }

  async uploadFile(bucket, path, file) {
    if (this.mockErrors.uploadFile) {
      return { data: null, error: this.mockErrors.uploadFile };
    }

    const key = `${bucket}/${path}`;
    this.mockFiles[key] = {
      file,
      bucket,
      path,
      uploadedAt: new Date().toISOString()
    };

    return { data: { path }, error: null };
  }

  async deleteFile(bucket, path) {
    if (this.mockErrors.deleteFile) {
      return { error: this.mockErrors.deleteFile };
    }

    const key = `${bucket}/${path}`;
    delete this.mockFiles[key];

    return { error: null };
  }

  getPublicUrl(bucket, path) {
    if (this.mockErrors.getPublicUrl) {
      throw this.mockErrors.getPublicUrl;
    }
    return `https://mock-storage.example.com/${bucket}/${path}`;
  }

  async uploadViaResumable(bucket, file, onProgress) {
    if (this.mockErrors.uploadViaResumable) {
      throw this.mockErrors.uploadViaResumable;
    }

    // Simulate upload progress
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
      if (onProgress) {
        onProgress((i / steps * 100).toFixed(2));
      }
    }

    const key = `${bucket}/${file.name}`;
    this.mockFiles[key] = {
      file,
      bucket,
      path: file.name,
      uploadedAt: new Date().toISOString()
    };

    return file.name;
  }
}
