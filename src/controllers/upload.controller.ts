import multer from "multer";
import path from 'path/win32';
import { configured } from "../utils/config.js";
import { Request } from "express";
import { FileUtils } from "../utils/files.js";
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
            destination: async (req, file, cb) => {
                try {
                    // Ensure directory exists with full permissions
                    await FileUtils.ensureDirectoryWithPermissions(directoryPath);
                    cb(null, directoryPath);
                } catch (error) {
                    cb(error as Error, directoryPath);
                }
            },
            filename: (req, file, cb) => {
                fileName(req, file, async (error, filename) => {
                    if (error) {
                        cb(error, filename);
                        return;
                    }
                    cb(null, filename);
                    // Set file permissions after it's created
                    setTimeout(async () => {
                        try {
                            const filePath = path.join(directoryPath, filename);
                            await FileUtils.setProperPermissions(filePath, false);
                        } catch (error) {
                            console.error('Error setting file permissions:', error);
                        }
                    }, 100);
                });
            }
        })
    }
}