import multer from 'multer';
import { Request, Response } from 'express';
import { configured } from '../utils/config.js';
import { UploadController } from './upload.controller.js';
import { sendBadRequest, sendNotFound, sendSuccess } from '../utils/response.js';

interface FileValidateCallback {
    (error: Error | null, acceptFile: boolean): void;
}

export class FilesController {

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
                if (file.path) {
                    file.path = file.path.replace(/\\/g, '/');
                }
            });

            sendSuccess(response, sanitizedFiles, 'Files uploaded successfully', 200);
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
}

export const {
    uploadFiles
} = FilesController;