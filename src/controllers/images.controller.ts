import sharp from 'sharp';
import { NextFunction, Request, Response } from 'express';
import { createReadStream, promises as fs } from 'fs';
import { ImageCache } from '../utils/image-cache.js';
import { findFileInDirectories } from '../utils/config.js';
import multer from 'multer'
import path from 'path/win32';
import crypto from 'crypto';

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

    static limitSize = 500 * 1024 * 1024; // 500 MB

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
            const filePath = findFileInDirectories(filename);

            let transform = sharp();
            let fileStream: NodeJS.ReadableStream | undefined;
            try {
                await fs.access(filePath);
                fileStream = createReadStream(filePath);
            } catch (error) {
                /**
                 * Generate placeholder if file not found
                */
                const width = w ? parseInt(w as string, 10) : 300;
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
                transform = transform.toFormat(fm as any, {
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
    static notFoundImage(option: { width: number; height: number } = { width: 300, height: 300 }): Buffer {
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
     * Upload image handler
     * @param req Request
     * @param res Response
    */
    static uploadImage = async (req: Request, res: Response): Promise<void> => {
        const dir = req.header('dir') || 'assets';

        const single = multer({
            storage: ImagesController.storage(dir),
            limits: { fileSize: ImagesController.limitSize },
            fileFilter: ImagesController.validateImage
        }).single('image');

        /**
         * Handle the upload
        */
        single(req, res, (err: any) => {
            const file = req.file;

            if (err instanceof multer.MulterError) {
                const field = err.field || 'image';
                res.status(400).json({
                    status: 400,
                    message: field == "image" ? err.message : `${field} is ${err.message}, Please change to: image`,
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
                const { fieldname, ...fileData } = file;
                res.status(200).json({
                    message: 'Image uploaded successfully',
                    status: 200,
                    result: fileData || {}
                });
            }
        });
    };

    /**
     * Upload multiple images handler
     * @param req Request
     * @param res Response
    */
    static uploadImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        const dir = req.header('dir') || 'assets';

        const multiple = multer({
            storage: ImagesController.storage(dir),
            limits: { fileSize: ImagesController.limitSize },
            fileFilter: ImagesController.validateImage
        }).array('images', 10); // Allow up to 10 images

        /**
         * Handle the upload
        */
        multiple(req, res, (err: any) => {
            const files = req.files;
            if (err instanceof multer.MulterError) {
                const field = err.field || 'images';
                res.status(400).json({
                    status: 400,
                    message: field == "images" ? err.message : `${field} is ${err.message}, Please change to: images`,
                });
            } else if (err) {
                res.status(400).json({
                    status: 400,
                    message: err.message
                });
                next();
            } else if (!files || files.length === 0) {
                res.status(400).json({
                    status: 400,
                    message: 'No files uploaded.'
                });
            } else {
                const sanitizedFiles = (files as Express.Multer.File[]).map(({ fieldname, ...fileData }) => fileData);
                res.status(200).json({
                    message: 'Images uploaded successfully',
                    status: 200,
                    result: sanitizedFiles || []
                });
                next();
            }
        });
    };

    /**
     * Multer storage configuration
     * @param dir Directory to store images
    */
    static storage = (dir: string) => {
        return multer.diskStorage({
            destination: dir,
            filename: (req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
                const uniqueId = crypto.randomUUID()
                callback(null, uniqueId + path.extname(file.originalname))
            }
        })
    }

    /**
     * Validate uploaded image file type
     * @param req Request
     * @param file Uploaded file
     * @param callback Callback function
    */
    static validateImage = (req: Request, file: Express.Multer.File, callback: ImageValidateCallback) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/jpg'
        ];
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
    uploadImage,
    uploadImages,
} = ImagesController;