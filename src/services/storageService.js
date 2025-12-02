import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import s3Client from "../config/s3.js";
import r2Client from "../config/r2.js";
import imagekitClient from "../config/imagekit.js";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";

const providers = {
  s3: {
    client: s3Client,
    bucket: config.aws.bucket,
    url: (key) => `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`,
  },
  r2: {
    client: r2Client,
    bucket: config.r2.bucket,
    url: (key) => `${config.r2.publicUrl.replace(/\/$/, "")}/${key}`,
  },
  imagekit: {
    client: imagekitClient,
    url: (key) => `${config.imagekit.urlEndpoint.replace(/\/$/, "")}/${key}`,
  },
};

const putObject = async ({ client, bucket, name }, key, body, contentType) => {
  if (name === "imagekit") {
    // ImageKit upload logic
    const response = await client.upload({
      file: body.toString("base64"), // ImageKit expects base64 or URL
      fileName: key.split("/").pop(), // Extract filename from key
      folder: key.split("/").slice(0, -1).join("/"), // Extract folder path
      useUniqueFileName: false, // We already generate a unique key
    });
    return response;
  }

  // S3/R2 upload logic
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  return await client.send(command);
};

const resolveProvider = (name = "s3") => {
  const normalized = name.toLowerCase();
  if (!providers[normalized]) {
    throw new Error(`Unsupported storage provider: ${name}`);
  }
  return { name: normalized, ...providers[normalized] };
};

export const storageService = {
  async uploadFile(buffer, { filename, contentType = "application/octet-stream", provider = "s3" } = {}) {
    const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${filename}`;
    const target = resolveProvider(provider);
    const uploadResult = await putObject(target, key, buffer, contentType);
    logger.info(`Uploaded file to ${provider}`, { key });

    const result = { provider: target.name, key, url: target.url(key) };
    if (target.name === "imagekit" && uploadResult && uploadResult.fileId) {
      result.fileId = uploadResult.fileId;
    }
    return result;
  },
  async uploadToMultiple(buffer, options = {}) {
    const targets = Array.isArray(options.providers) && options.providers.length ? options.providers : Object.keys(providers);
    const results = await Promise.all(
      targets.map(async (providerName) => {
        const providerConfig = resolveProvider(providerName);
        const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${options.filename || "blob"}`;
        const uploadResult = await putObject(providerConfig, key, buffer, options.contentType || "application/octet-stream");

        const result = { provider: providerConfig.name, key, url: providerConfig.url(key) };
        if (providerConfig.name === "imagekit" && uploadResult && uploadResult.fileId) {
          result.fileId = uploadResult.fileId;
        }
        return result;
      }),
    );
    return results;
  },
  async deleteFile(keyOrId, provider = "s3") {
    const target = resolveProvider(provider);

    if (target.name === "imagekit") {
      try {
        // If keyOrId looks like a path (contains /), we need to find the fileId first
        if (keyOrId.includes('/')) {
          const fileName = keyOrId.split('/').pop();
          const folderPath = keyOrId.split('/').slice(0, -1).join('/');
          
          // Normalize the path - ImageKit uses leading slash in filePath
          const normalizedPath = keyOrId.startsWith('/') ? keyOrId : `/${keyOrId}`;
          
          logger.info(`Looking up ImageKit file`, { fileName, folderPath, fullPath: keyOrId, normalizedPath });
          
          // List files with the given path to find the fileId
          // ImageKit API: GET https://api.imagekit.io/v1/files with search parameters
          // Try listing files in the folder
          const listResult = await target.client.listFiles({
            path: folderPath,
            limit: 100 // Get more results to ensure we find the file
          });
          
          logger.info(`ImageKit listFiles result`, { 
            count: listResult?.length, 
            files: listResult?.map(f => ({ fileId: f.fileId, filePath: f.filePath, name: f.name }))
          });
          
          if (listResult && listResult.length > 0) {
            // Find exact match by filePath (ImageKit stores with leading slash)
            const exactMatch = listResult.find(file => 
              file.filePath === normalizedPath || 
              file.filePath === keyOrId ||
              file.name === fileName
            );
            const fileToDelete = exactMatch || listResult[0];
            
            // ImageKit API: DELETE https://api.imagekit.io/v1/files/{fileId}
            // The SDK handles Basic auth automatically using privateKey
            await target.client.deleteFile(fileToDelete.fileId);
            logger.info(`Deleted file from ${provider} using path lookup`, { 
              path: keyOrId, 
              fileId: fileToDelete.fileId,
              filePath: fileToDelete.filePath 
            });
          } else {
            logger.warn(`File not found in ImageKit`, { path: keyOrId, fileName, folderPath });
            throw new Error(`File not found in ImageKit: ${keyOrId}`);
          }
        } else {
          // Direct fileId deletion
          // ImageKit API: DELETE https://api.imagekit.io/v1/files/{fileId}
          // The SDK handles Basic auth automatically using privateKey
          logger.info(`Attempting to delete ImageKit file by fileId`, { fileId: keyOrId });
          
          try {
            const deleteResult = await target.client.deleteFile(keyOrId);
            logger.info(`Successfully deleted file from ${provider}`, { fileId: keyOrId, result: deleteResult });
          } catch (deleteError) {
            // Log the specific error from ImageKit
            logger.error(`ImageKit deleteFile failed`, { 
              fileId: keyOrId, 
              error: deleteError.message,
              response: deleteError.response?.data,
              status: deleteError.response?.status
            });
            throw deleteError;
          }
        }
      } catch (error) {
        logger.error(`Failed to delete file from ImageKit`, { keyOrId, error: error.message, stack: error.stack });
        throw error;
      }
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: target.bucket,
      Key: keyOrId,
    });
    await target.client.send(command);
    logger.info(`Deleted file from ${provider}`, { key: keyOrId });
  },
};

