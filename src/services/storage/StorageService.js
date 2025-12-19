/**
 * Abstract StorageService interface
 * All storage implementations should extend this class
 */
export class StorageService {
  /**
   * Upload a file to storage
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in bucket
   * @param {File} file - File to upload
   * @returns {Promise<{data: {path: string}, error: Error|null}>}
   */
  async uploadFile(bucket, path, file) {
    throw new Error('uploadFile() must be implemented');
  }

  /**
   * Delete a file from storage
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in bucket
   * @returns {Promise<{error: Error|null}>}
   */
  async deleteFile(bucket, path) {
    throw new Error('deleteFile() must be implemented');
  }

  /**
   * Get public URL for a file
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in bucket
   * @returns {string} Public URL
   */
  getPublicUrl(bucket, path) {
    throw new Error('getPublicUrl() must be implemented');
  }

  /**
   * Upload file via resumable protocol (TUS)
   * @param {string} bucket - Bucket name
   * @param {File} file - File to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<string>} File path
   */
  async uploadViaResumable(bucket, file, onProgress) {
    throw new Error('uploadViaResumable() must be implemented');
  }
}
