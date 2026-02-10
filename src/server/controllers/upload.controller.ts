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
            // Properly decode and normalize Unicode filenames
            // Multer might incorrectly encode non-ASCII characters, so we decode and normalize
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const normalizedName = originalName.normalize('NFC');

            const useOriginalFilename = request.get('X-Prefix') ?? null;

            if (useOriginalFilename) {
                // Normalize the prefix to handle Unicode characters
                const normalizedPrefix = useOriginalFilename.normalize('NFC');
                const uniqueId = crypto.randomUUID();
                const extension = path.extname(normalizedName);
                callback(null, `${normalizedPrefix}_${uniqueId}${extension}`);
                return;
            }

            const date = new Date();
            const prefix = date.toJSON({ year: 'numeric', month: '2-digit', day: '2-digit', }).split('T')[0];
            const uniqueId = prefix + "_" + crypto.randomUUID()
            const extension = path.extname(normalizedName);
            callback(null, uniqueId + extension)
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