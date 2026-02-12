import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";
import fs from 'fs';
import path from 'path';

export class MyFileController extends Controller {

    public static get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;

        // Extract folder path from params
        // When using regex route, captured groups are in request.params[0], [1], etc.
        const folderPath = request.params[0] || '';

        // Get folder structure
        const folderData = MyFileController.getFolderStructure(folderPath);

        const pageData = {
            ...Controller.defaultConfig,
            page: 'my-file',
            title: `My Files - ${Controller.defaultConfig.title}`,
            currentPath,
            folderPath,
            folders: folderData.folders,
            files: folderData.files,
            breadcrumbs: MyFileController.generateBreadcrumbs(folderPath),
            folderName: folderPath ? path.basename(folderPath) : 'My Files',
            stats: folderData.stats
        };

        response.render('layouts/main', pageData);
    }

    private static getFolderStructure(folderPath: string) {
        const basePath = 'storage';
        const fullPath = path.join(basePath, folderPath).replace(/\\/g, '/');

        const folders: any[] = [];
        const files: any[] = [];
        let totalFiles = 0;
        let totalFolders = 0;

        try {
            if (!fs.existsSync(fullPath)) {
                return { folders, files, stats: { totalFiles, totalFolders } };
            }

            const entries = fs.readdirSync(fullPath, { withFileTypes: true });

            for (const entry of entries) {
                const entryPath = path.join(fullPath, entry.name);

                if (entry.isDirectory()) {
                    // Count items in subfolder
                    let itemCount = 0;
                    try {
                        const subEntries = fs.readdirSync(entryPath);
                        itemCount = subEntries.length;
                    } catch (err) {
                        itemCount = 0;
                    }

                    folders.push({
                        name: entry.name,
                        type: 'folder',
                        itemCount,
                        path: folderPath ? `${folderPath}/${entry.name}` : entry.name
                    });
                    totalFolders++;
                } else {
                    const stats = fs.statSync(entryPath);
                    const ext = entry.name.split('.').pop()?.toLowerCase() || '';

                    files.push({
                        name: entry.name,
                        type: 'file',
                        size: stats.size,
                        extension: ext,
                        modifiedAt: stats.mtime,
                        path: folderPath ? `${folderPath}/${entry.name}` : entry.name
                    });
                    totalFiles++;
                }
            }
        } catch (error) {
            console.error('Error reading folder structure:', error);
        }

        return {
            folders,
            files,
            stats: { totalFiles, totalFolders }
        };
    }

    private static generateBreadcrumbs(folderPath: string) {
        if (!folderPath) return [];

        const parts = folderPath.split('/').filter(p => p);
        const breadcrumbs: Array<{ name: string; path: string }> = [];

        let currentPath = '';
        for (const part of parts) {
            currentPath += (currentPath ? '/' : '') + part;
            breadcrumbs.push({
                name: part,
                path: `/files/${currentPath}`
            });
        }

        return breadcrumbs;
    }

}
