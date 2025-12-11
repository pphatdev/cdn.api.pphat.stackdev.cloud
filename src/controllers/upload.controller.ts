import multer from "multer";
import path from 'path/win32';
import { configured } from "../utils/config.js";
import { Request } from "express";

export class UploadController {

    /**
     * Multer storage configuration
     * @param dir Directory to store images
    */
    static storage = (dir: string) => {
        const directoryPath = configured.baseDirectory + (dir.startsWith('/') ? dir : `/${dir}`);

        const fileName = (request: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {

            if (configured.uploadOriginalName) {
                const date = new Date();
                const timestamp = date.getTime();
                callback(null, `${timestamp}-` + (file.originalname).replace(/\s+/g, '_'));
                return;
            }

            const uniqueId = crypto.randomUUID()
            callback(null, uniqueId + path.extname(file.originalname))
        }

        return multer.diskStorage({
            destination: directoryPath,
            filename: fileName
        })
    }
}