import multer from 'multer';
import { Request, Response } from 'express';
import { configured } from '../utils/config.js';
import { UploadController } from './upload.controller.js';
import { sendBadRequest, sendNotFound, sendSuccess } from '../utils/response.js';
import fs from 'fs';
import { reloadPM2Service } from '../utils/pm2.js';
import { FileUtils } from '../utils/files.js';

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
            reloadPM2Service();
        } catch (err: any) {
            sendBadRequest(response, err.message || 'Failed to move file.');
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
        multiple(request, response, (err: any) => {
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
            sanitizedFiles.forEach(file => {
                const sanitizedFile: any = {
                    ...file,
                    path: file.path.replace(/\\/g, '/'),
                    fileName: file.originalname,
                    pathFile: file.path,
                    type: file.mimetype,
                    name: file.filename,
                    extension: file.originalname.split('.').pop()
                };
                Object.assign(file, sanitizedFile);
            });


            sendSuccess(response, sanitizedFiles, 'Files uploaded successfully', 200);
            reloadPM2Service();
        });
    };

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
                        previewUrl: type === 'image' ? `/source/v1/files/image/${file}` : null
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

}

export const {
    uploadFiles,
    searchFileByName
    ,moveFileToDir
} = FilesController;