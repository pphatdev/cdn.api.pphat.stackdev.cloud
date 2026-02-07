import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { sendBadRequest, sendNotFound, sendSuccess } from '../../utils/response.js';

export class FolderController {
    /**
     * Get folder structure dynamically based on the route
     * @param request Request
     * @param response Response
     */
    static getFolderStructure = async (request: Request, response: Response): Promise<void> => {
        const basePath = 'storage';
        // Get the path from params[0] for regex routes, or params.path for named routes
        const dynamicPath = request.params[0] || request.params.path || '';
        const currentDirectory = path.join(basePath, dynamicPath).replace(/\\/g, '/').replace(/,+/g, '/');

        try {
            if (!fs.existsSync(currentDirectory)) {
                sendNotFound(response, `Directory '${currentDirectory}' does not exist.`);
                return;
            }

            const getStructure = (dir: string): any => {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                return entries.map(entry => {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        return {
                            name: entry.name,
                            type: 'folder',
                            children: getStructure(fullPath)
                        };
                    } else {
                        return {
                            name: entry.name,
                            type: 'file'
                        };
                    }
                });
            };

            const structure = getStructure(currentDirectory);
            sendSuccess(response, structure, 'Folder structure retrieved successfully.', 200);
        } catch (error) {
            sendBadRequest(response, 'Failed to retrieve folder structure.');
        }
    };
}