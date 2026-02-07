import sharp from 'sharp';
import multer from 'multer';
import { Request, Response } from 'express';
import { createReadStream, promises as fs } from 'fs';
import { ImageCache } from '../../utils/image-cache.js';
import { configured } from '../../utils/config.js';
import { UploadController } from './upload.controller.js';
import { sendBadRequest, sendNotFound, sendSuccess } from '../../utils/response.js';
import { FilesController } from './files.controller.js';
import { findFileInDirectories } from '../../utils/directories.js';

interface ImageQueryParams {
    fm?: string;
    q?: string;
    w?: string;
    h?: string;
    fit?: string;
}

interface ImageValidateCallback {
    (error: Error | null, acceptFile: boolean): void;
}

export class ImagesController {

    /**
     * Get and optimize image
     * @param req Request
     * @param res Response
    */
    static async getImage(req: Request, res: Response): Promise<void> {
        try {
            const { filename } = req.params;
            const { fm, q, w, h, fit } = req.query as ImageQueryParams;

            /**
             * Create a cache key based on the image parameters
            */
            const cacheKey = `${filename}-w${w || ''}-h${h || ''}-fm${fm || ''}-q${q || ''}-fit${fit || ''}`;

            /**
             * Determine content type based on format
            */
            const format = fm || 'png';
            const contentType = `image/${format === 'jpg' ? 'jpeg' : format}`;

            /**
             * Try to get from cache first
            */
            const cachedImage = await ImageCache.getImage(cacheKey, `.${format}`);
            if (cachedImage) {
                res.set('Content-Type', contentType);
                res.send(cachedImage);
                return;
            }

            /**
             * Find the file in configured directories
            */
            const filePath = await findFileInDirectories(filename);

            let transform = sharp();
            let fileStream: NodeJS.ReadableStream | undefined;
            try {
                await fs.access(filePath);
                fileStream = createReadStream(filePath);
            } catch (error) {
                /**
                 * Generate placeholder if file not found
                */
                const width = w ? parseInt(w as string, 10) : 512;
                const height = h ? parseInt(h as string, 10) : width;
                transform = sharp({ create: { width, height, channels: 4, background: { r: 200, g: 200, b: 200, alpha: 1 } } })
                    .composite([{ input: ImagesController.notFoundImage({ width, height }), top: 0, left: 0 }]);
            }

            if (w || h) {
                transform = transform.resize({
                    width: w ? parseInt(w as string, 10) : undefined,
                    height: h ? parseInt(h as string, 10) : undefined,
                    fit: (fit as any) || 'cover'
                });
            }

            transform = transform.png();
            if (fm) {
                transform = transform.toFormat(format as any, {
                    quality: q ? parseInt(q as string, 10) : 60
                });
            }

            /**
             * Create a buffer from the transformed image
            */
            let imageBuffer: Buffer;
            if (fileStream) {
                imageBuffer = await fileStream.pipe(transform).toBuffer();
            } else {
                imageBuffer = await transform.toBuffer();
            }

            /**
             * Cache the transformed image
            */
            await ImageCache.saveImage(cacheKey, imageBuffer, `.${format}`);

            /**
             * Send the response
            */
            res.set('Content-Type', contentType);
            res.send(imageBuffer);

        } catch (error) {
            console.error('Image processing error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * Generate a simple SVG placeholder for not found images
     * @param option Object with width and height
     * @returns Buffer
    */
    static notFoundImage(option: { width: number; height: number } = { width: 512, height: 512 }): Buffer {
        const { width, height } = option;
        return Buffer.from(`
            <svg width="${width}" height="${height}" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="#f7f7f7"/>
                <g>
                    <path d="M70 65L62 55C61 53 59.5 52 58 52C56.5 52 55 53 54 55L50 60C49.5 61 48.5 61.5 47.5 61.5C46.5 61.5 45.5 61 45 60L44.5 59.5C43.5 58.5 42.5 58 41.5 58.2C40.5 58.4 39.5 59 39 60L35 66C34 68 34.2 70 35.5 71.5C36.8 73 38.8 74 41 74H59C61 74 63 73 64.5 71.5C66 70 66.2 67.8 70 65Z" fill="#AEB7BE"/>
                    <circle cx="45" cy="42" r="6" fill="#AEB7BE"/>
                </g>
            </svg>
        `);
    }

    /**
     * Upload multiple images handler
     * @param request Request
     * @param response Response
    */
    static uploadImages = async (request: Request, response: Response): Promise<void> => {
        const storage = request.header('storage') || configured.defaultStoragePath;

        const multiple = multer({
            storage: UploadController.storage(storage),
            limits: {
                fileSize: configured.images.maxSize
            },
            fileFilter: ImagesController.validateImage
        }).array('images', configured.images.maxFilesUpload);

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
                    fileName: file.originalname,
                    path: `/assets/image/${file.filename}`,
                    pathFile: `/assets/image/${file.filename}`,
                    type: file.mimetype,
                    name: file.filename,
                    extension: file.originalname.split('.').pop()
                };
                Object.assign(file, sanitizedFile);

                // Sync file after upload - use the original file system path and original filename
                await FilesController.syncFile(originalFilePath, file.originalname);
            }

            sendSuccess(response, sanitizedFiles, 'Files uploaded successfully', 200);
        });
    };

    /**
     * Validate uploaded image file type
     * @param req Request
     * @param file Uploaded file
     * @param callback Callback function
    */
    static validateImage = (req: Request, file: Express.Multer.File, callback: ImageValidateCallback) => {
        const allowedTypes = configured.images.allowedTypes;
        if (allowedTypes.includes(file.mimetype)) {
            callback(null, true)
        } else {
            callback(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP allowed.'), false)
        }
    }
}

export const {
    getImage,
    notFoundImage,
    uploadImages,
} = ImagesController;