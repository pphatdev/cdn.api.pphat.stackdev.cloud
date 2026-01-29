import multer from 'multer';
import { Request, Response } from 'express';
import { configured } from '../utils/config.js';
import { UploadController } from './upload.controller.js';
import { sendBadRequest, sendNotFound, sendSuccess } from '../utils/response.js';
import { FileUtils } from '../utils/files.js';
import { Database } from '../utils/database.js';
import fs from 'fs';

interface FileValidateCallback {
    (error: Error | null, acceptFile: boolean): void;
}

export class FilesController {
    /**
     * Move a file by name to a specified directory
     * @param request Request
     * @param response Response
     */
    static moveFileToDir = async (request: Request, response: Response): Promise<void> => {

        const { filename } = request.params;
        // target directory from headers
        const storage = `${configured.baseDirectory}/${request.headers.storage as string}`;

        if (!filename || !storage) {
            sendBadRequest(response, 'filename and targetDir are required.');
            return;
        }

        const storages = configured.directories;
        let sourcePath = null;
        for (const dir of storages) {
            const filePath = `${dir}/${filename}`.replace(/\\/g, '/');
            if (fs.existsSync(filePath)) {
                sourcePath = filePath;
                break;
            }
        }

        if (!sourcePath) {
            sendNotFound(response, 'File not found.');
            return;
        }

        // Ensure target directory exists with full permissions
        if (!fs.existsSync(storage)) {
            await FileUtils.ensureDirectoryWithPermissions(storage);
        }

        const destPath = `${storage}/${filename}`.replace(/\\/g, '/');

        try {
            fs.renameSync(sourcePath, destPath);
            // Set proper permissions for both file and directory
            await FileUtils.setProperPermissions(destPath, false);
            await FileUtils.setProperPermissions(storage, true);
            sendSuccess(response, { oldPath: sourcePath, newPath: destPath }, 'File moved successfully', 200);
        } catch (err: any) {
            sendBadRequest(response, err.message || 'Failed to move file.');
        }
    };

    /**
     * Upload a file as base64
     * @param request Request
     * @param response Response
     */
    static uploadFileBase64 = async (request: Request, response: Response): Promise<void> => {
        try {
            const { base64, filename, mimetype, storage: storageHeader } = request.body;
            if (!base64 || !filename || !mimetype) {
                sendBadRequest(response, 'base64, filename, and mimetype are required.');
                return;
            }

            // Validate mimetype
            const allowedTypes = configured.files.allowedTypes;
            if (!allowedTypes.includes(mimetype)) {
                sendBadRequest(response, 'Invalid file type.');
                return;
            }

            // Determine storage directory
            const storage = storageHeader || request.header('storage') || configured.defaultStoragePath;
            const dirPath = `${configured.baseDirectory}/${storage}`.replace(/\\/g, '/');
            await FileUtils.ensureDirectoryWithPermissions(dirPath);

            // Decode base64
            let base64Data = base64;
            // Remove data URL prefix if present
            if (base64Data.startsWith('data:')) {
                base64Data = base64Data.substring(base64Data.indexOf(',') + 1);
            }
            const buffer = Buffer.from(base64Data, 'base64');

            // Save file
            const filePath = `${dirPath}/${filename}`.replace(/\\/g, '/');
            await FileUtils.createFileWithPermissions(filePath, buffer);

            // Sync file after upload
            await FilesController.syncFile(filePath);

            // Prepare response info
            const fileInfo = {
                fileName: filename,
                path: `/file/preview/${filename}`,
                pathFile: `/file/preview/${filename}`,
                type: mimetype,
                name: filename,
                extension: filename.split('.').pop(),
                size: buffer.length
            };

            sendSuccess(response, fileInfo, 'File uploaded successfully', 200);
        } catch (err: any) {
            sendBadRequest(response, err.message || 'Failed to upload file as base64.');
        }
    };


    /**
     * Upload multiple files as base64
     * @param request Request
     * @param response Response
     */
    static uploadMultipleFilesBase64 = async (request: Request, response: Response): Promise<void> => {
        try {
            const { files, storage: storageHeader } = request.body;
            if (!Array.isArray(files) || files.length === 0) {
                sendBadRequest(response, 'files (array) are required.');
                return;
            }

            const allowedTypes = configured.files.allowedTypes;
            const storage = storageHeader || request.header('storage') || configured.defaultStoragePath;
            const dirPath = `${configured.baseDirectory}/${storage}`.replace(/\\/g, '/');
            await FileUtils.ensureDirectoryWithPermissions(dirPath);

            const results = [];
            for (const file of files) {
                const { base64, filename, mimetype } = file;
                if (!base64 || !filename || !mimetype) {
                    results.push({ filename, error: 'base64, filename, and mimetype are required.' });
                    continue;
                }
                if (!allowedTypes.includes(mimetype)) {
                    results.push({ filename, error: 'Invalid file type.' });
                    continue;
                }
                let base64Data = base64;
                if (base64Data.startsWith('data:')) {
                    base64Data = base64Data.substring(base64Data.indexOf(',') + 1);
                }
                try {
                    const buffer = Buffer.from(base64Data, 'base64');
                    const filePath = `${dirPath}/${filename}`.replace(/\\/g, '/');
                    await FileUtils.createFileWithPermissions(filePath, buffer);

                    // Sync file after upload
                    await FilesController.syncFile(filePath);

                    results.push({
                        fileName: filename,
                        path: `/file/preview/${filename}`,
                        pathFile: `/file/preview/${filename}`,
                        type: mimetype,
                        name: filename,
                        extension: filename.split('.').pop(),
                        size: buffer.length,
                        success: true
                    });
                } catch (err: any) {
                    results.push({ filename, error: err.message || 'Failed to upload file.' });
                }
            }
            sendSuccess(response, results, 'Multiple files processed', 200);
        } catch (err: any) {
            sendBadRequest(response, err.message || 'Failed to upload files as base64.');
        }
    };


    /**
     * Upload multiple files handler
     * @param request Request
     * @param response Response
    */
    static uploadFiles = async (request: Request, response: Response): Promise<void> => {
        const storage = request.header('storage') || configured.defaultStoragePath;
        const multiple = multer({
            storage: UploadController.storage(storage),
            limits: {
                fileSize: configured.files.maxSize
            },
            fileFilter: FilesController.validateFile
        }).array('files', configured.files.maxFilesUpload);

        /**
         * Handle the upload
        */
        multiple(request, response, async (err: any) => {
            const files = request.files;
            if (!files || files.length === 0) {
                sendNotFound(response, 'No files uploaded.');
                return;
            }

            if (err instanceof multer.MulterError) {
                const field = err.field || 'files';
                sendBadRequest(response, field == "files" ? err.message : `${field} is ${err.message}, Please change to: files`);
                return;
            } else if (err) {
                sendBadRequest(response, err.message);
                return;
            }
            const sanitizedFiles = (files as Express.Multer.File[]).map(({ fieldname, ...fileData }) => fileData);

            // reduce value of key "path" to be relative to storage directory
            for (const file of sanitizedFiles) {
                // Preserve the original file system path before modification
                const originalFilePath = file.path;
                
                const sanitizedFile: any = {
                    ...file,
                    // path: file.path.replace(/\\/g, '/'),
                    fileName: file.originalname,
                    path: `/file/preview/${file.filename}`,
                    pathFile: `/file/preview/${file.filename}`,
                    type: file.mimetype,
                    name: file.filename,
                    extension: file.originalname.split('.').pop()
                };
                Object.assign(file, sanitizedFile);

                // Sync file after upload with original filename - use the original filesystem path
                await FilesController.syncFile(originalFilePath, file.originalname);
            }

            sendSuccess(response, sanitizedFiles, 'Files uploaded successfully', 200);
        });
    };

    /**
     * Sync a file after upload
     * @param filePath Path to the file to sync
     * @param originalFilename Original filename from upload (optional)
     */
    static async syncFile(filePath: string, originalFilename?: string): Promise<void> {
        try {
            // Get the actual file path on disk
            const actualFilePath = filePath.startsWith(configured.baseDirectory) ? filePath : `${configured.baseDirectory}${filePath}`;

            // Extract folder structure from the file path
            const relativePath = actualFilePath.replace(configured.baseDirectory, '').replace(/\\/g, '/');
            const folderPath = relativePath.substring(0, relativePath.lastIndexOf('/'));

            // Check if file exists
            if (!fs.existsSync(actualFilePath)) {
                console.error(`File not found for sync: ${actualFilePath}`);
                return;
            }

            // Get file stats
            const stats = fs.statSync(actualFilePath);

            // Ensure proper permissions are set
            await FileUtils.setProperPermissions(actualFilePath, false);

            // Extract filename
            const filename = actualFilePath.replace(/\\/g, '/').split('/').pop() || 'unknown';
            const ext = filename.split('.').pop()?.toLowerCase();

            // Check if file is an image
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
            const isImage = ext ? imageExtensions.includes(ext) : false;

            // Create file metadata
            const metadata = {
                filename: filename,
                originalFilename: originalFilename || filename,
                path: actualFilePath.replace(/\\/g, '/'),
                relativePath: relativePath,
                folderPath: folderPath,
                size: stats.size,
                extension: ext || '',
                mimeType: this.getMimeType(ext || ''),
                previewUrl: isImage ? `/assets/image/${filename}` : `/file/preview/${filename}`,
                createdAt: stats.birthtime.toISOString(),
                modifiedAt: stats.mtime.toISOString(),
                uploadedAt: new Date().toISOString()
            };

            // Save to database
            await Database.addFile(metadata);

        } catch (error: any) {
            console.error(`Error syncing file ${filePath}:`, error.message);
        }
    }



    /**
     * Get MIME type based on file extension
     * @param ext File extension
     */
    static getMimeType(ext: string): string {
        const mimeTypes: { [key: string]: string } = {
            // Images
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            // Documents
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain',
            // Spreadsheets
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv': 'text/csv',
            // Presentations
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Archives
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * Validate uploaded file type
     * @param request Request
     * @param file Uploaded file
     * @param callback Callback function
    */
    static validateFile = (request: Request, file: Express.Multer.File, callback: FileValidateCallback) => {
        const allowedTypes = configured.files.allowedTypes;
        if (allowedTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new Error('Invalid file type. Only PDF and Office files are allowed.'), false);
        }
    };

    /**
     * Search for a file by name
     * @param request Request
     * @param response Response
    */
    static searchFileByName = async (request: Request, response: Response): Promise<void> => {
        const { q, type } = request.query;

        const data = []

        // get all directories from config
        const storage = configured.directories;
        // search for the file in each directory
        for (const dir of storage) {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                const matches = files.filter(file => {
                    const matchesQuery = file.toLowerCase().includes((q as string).toLowerCase());
                    if (type) {
                        const ext = file.split('.').pop()?.toLowerCase();
                        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
                        const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'];

                        if (type === 'image') {
                            return matchesQuery && ext && imageExtensions.includes(ext);
                        } else if (type === 'office') {
                            return matchesQuery && ext && officeExtensions.includes(ext);
                        }
                        return matchesQuery && ext === (type as string).toLowerCase();
                    }
                    return matchesQuery;
                });

                matches.forEach(file => {
                    const filePath = `${dir}/${file}`.replace(/\\/g, '/');
                    const stats = fs.statSync(filePath);
                    data.push({
                        dir: dir,
                        name: file,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        modifiedAt: stats.mtime,
                        relativePath: filePath,
                        previewUrl: type === 'image' ? `/assets/image/${file}` : null
                    });
                });
            }
        }

        if (data.length === 0) {
            sendNotFound(response, 'No files matched the search criteria.');
            return;
        }
        sendSuccess(response, data, 'Files retrieved successfully', 200);
    };

    /**
     * Download a file by filename
     * @param request Request
     * @param response Response
    */
    static downloadFile = async (request: Request, response: Response): Promise<void> => {
        const { filename } = request.params;
        // find the file in configured directories
        const storage = configured.directories;

        for (const dir of storage) {
            const filePath = `${dir}/${filename}`.replace(/\\/g, '/');
            if (fs.existsSync(filePath)) {
                response.download(filePath);
                return;
            }
        }
        sendNotFound(response, 'File not found.');
    };

    /**
     * Delete a file by filename
     * @param request Request
     * @param response Response
    */
    static deleteFile = async (request: Request, response: Response): Promise<void> => {
        const { filename } = request.params;

        if (!filename) {
            sendBadRequest(response, 'filename is required.');
            return;
        }

        // Find the file in configured directories
        const storage = configured.directories;
        let foundFilePath = null;

        for (const dir of storage) {
            const filePath = `${dir}/${filename}`.replace(/\\/g, '/');
            if (fs.existsSync(filePath)) {
                foundFilePath = filePath;
                break;
            }
        }

        if (!foundFilePath) {
            sendNotFound(response, 'File not found.');
            return;
        }

        try {
            // Delete the file
            fs.unlinkSync(foundFilePath);

            // Delete from database
            await Database.deleteFile(filename);

            sendSuccess(response, {
                filename: filename,
                deletedPath: foundFilePath
            }, 'File deleted successfully', 200);
        } catch (err: any) {
            sendBadRequest(response, err.message || 'Failed to delete file.');
        }
    };

}

export const {
    uploadFiles,
    searchFileByName,
    moveFileToDir,
    uploadFileBase64,
    uploadMultipleFilesBase64,
    deleteFile
} = FilesController;