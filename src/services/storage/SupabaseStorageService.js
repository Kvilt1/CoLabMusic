import { StorageService } from './StorageService';
import * as tus from 'tus-js-client';

/**
 * Supabase implementation of StorageService
 */
export class SupabaseStorageService extends StorageService {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async uploadFile(bucket, path, file) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    return { data, error };
  }

  async deleteFile(bucket, path) {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    return { error };
  }

  getPublicUrl(bucket, path) {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async uploadViaResumable(bucket, file, onProgress) {
    return new Promise((resolve, reject) => {
      const { data: { session } } = this.supabase.auth.getSession();
      const projectId = this.supabase.supabaseUrl.split('//')[1].split('.')[0];

      const upload = new tus.Upload(file, {
        endpoint: `${this.supabase.supabaseUrl}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${session?.access_token}`,
          'x-upsert': 'true',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: bucket,
          objectName: file.name,
          contentType: file.type,
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024,
        onError: (error) => {
          console.error('TUS Upload error:', error);
          reject(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          if (onProgress) {
            onProgress(percentage);
          }
        },
        onSuccess: () => {
          resolve(file.name);
        },
      });

      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      });
    });
  }
}
