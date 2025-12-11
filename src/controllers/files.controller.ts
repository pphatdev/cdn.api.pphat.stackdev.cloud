import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path/win32';
import crypto from 'crypto';

interface FileValidateCallback {
    (error: Error | null, acceptFile: boolean): void;
}

export class FilesController {

    static limitSize = 500 * 1024 * 1024; // 500 MB

    /**
     * Upload single file handler
     * @param req Request
     * @param res Response
    */
    static uploadFile = async (req: Request, res: Response): Promise<void> => {
        const dir = req.header('dir') || 'assets';

        const single = multer({
            storage: FilesController.storage(dir),
            limits: { fileSize: FilesController.limitSize },
            fileFilter: FilesController.validateFile
        }).single('file');

        /**
         * Handle the upload
        */
        single(req, res, (err: any) => {
            const file = req.file;

            if (err instanceof multer.MulterError) {
                const field = err.field || 'file';
                res.status(400).json({
                    status: 400,
                    message: field == "file" ? err.message : `${field} is ${err.message}, Please change to: file`,
                });
            } else if (err) {
                res.status(400).json({
                    status: 400,
                    message: err.message
                });
            } else if (!file) {
                res.status(400).json({
                    status: 400,
                    message: 'No file uploaded.'
                });
            } else {
                const { fieldname, ...fileData } = file || {};
                res.status(200).json({
                    message: 'File uploaded successfully',
                    status: 200,
                    result: fileData || {}
                });
            }
        });
    };

    /**
     * Upload multiple files handler
     * @param req Request
     * @param res Response
    */
    static uploadFiles = async (req: Request, res: Response): Promise<void> => {
        const dir = req.header('dir') || 'assets';

        const multiple = multer({
            storage: FilesController.storage(dir),
            limits: { fileSize: FilesController.limitSize },
            fileFilter: FilesController.validateFile
        }).array('files', 10); // Allow up to 10 files

        /**
         * Handle the upload
        */
        multiple(req, res, (err: any) => {
            const files = req.files;

            if (err instanceof multer.MulterError) {
                const field = err.field || 'files';
                res.status(400).json({
                    status: 400,
                    message: field == "files" ? err.message : `${field} is ${err.message}, Please change to: files`,
                });
            } else if (err) {
                res.status(400).json({
                    status: 400,
                    message: err.message
                });
            } else if (!files || files.length === 0) {
                res.status(400).json({
                    status: 400,
                    message: 'No files uploaded.'
                });
            } else {
                const sanitizedFiles = (files as Express.Multer.File[]).map(({ fieldname, ...fileData }) => fileData);
                res.status(200).json({
                    message: 'Files uploaded successfully',
                    status: 200,
                    result: sanitizedFiles || []
                });
            }
        });
    };

    /**
     * Multer storage configuration
     * @param dir Directory to store files
    */
    static storage = (dir: string) => {
        return multer.diskStorage({
            destination: dir,
            filename: (req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
                const uniqueId = crypto.randomUUID();
                callback(null, uniqueId + path.extname(file.originalname));
            }
        });
    };

    /**
     * Validate uploaded file type
     * @param req Request
     * @param file Uploaded file
     * @param callback Callback function
    */
    static validateFile = (req: Request, file: Express.Multer.File, callback: FileValidateCallback) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new Error('Invalid file type. Only PDF and Office files are allowed.'), false);
        }
    };
}

export const {
    uploadFile,
    uploadFiles
} = FilesController;