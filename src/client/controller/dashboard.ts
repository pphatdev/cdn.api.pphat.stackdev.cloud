import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";
import { StorageUtils } from "../../server/utils/storage.js";

export class DashboardController extends Controller {

    public static async get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;

        try {
            // Fetch storage data from server-side
            const storageData = await StorageUtils.getStorageStats();

            // Categorize data for the dashboard
            const categorizedData = DashboardController.categorizeStorageData(storageData);

            const dashboardData = {
                ...Controller.defaultConfig,
                title: `Dashboard - ${Controller.defaultConfig.title}`,
                currentPath,
                storageData,
                categorizedData,
                maxStorageGB: 50
            };

            response.render('layouts/main', dashboardData);
        } catch (error) {
            console.error('Error fetching storage data:', error);

            // Render with empty data on error
            const dashboardData = {
                ...Controller.defaultConfig,
                title: `Dashboard - ${Controller.defaultConfig.title}`,
                currentPath,
                storageData: null,
                categorizedData: null,
                maxStorageGB: 50,
                error: 'Failed to load storage data'
            };

            response.render('layouts/main', dashboardData);
        }
    }

    private static categorizeStorageData(storageData: any) {
        const { totalSize, fileTypeBreakdown } = storageData;

        // Type mappings for categorization
        const typeMapping: Record<string, string> = {
            'jpg': 'images', 'jpeg': 'images', 'png': 'images', 'gif': 'images',
            'svg': 'images', 'webp': 'images', 'bmp': 'images',
            'pdf': 'documents', 'doc': 'documents', 'docx': 'documents',
            'txt': 'documents', 'rtf': 'documents', 'odt': 'documents',
            'mp4': 'videos', 'mov': 'videos', 'avi': 'videos',
            'mkv': 'videos', 'flv': 'videos', 'wmv': 'videos',
            'zip': 'archives', 'rar': 'archives', '7z': 'archives',
            'tar': 'archives', 'gz': 'archives'
        };

        // Initialize category data
        const categories: Record<string, { size: number; count: number; percentage: number }> = {
            images: { size: 0, count: 0, percentage: 0 },
            documents: { size: 0, count: 0, percentage: 0 },
            videos: { size: 0, count: 0, percentage: 0 },
            archives: { size: 0, count: 0, percentage: 0 },
            others: { size: 0, count: 0, percentage: 0 }
        };

        // Categorize file types
        Object.entries(fileTypeBreakdown).forEach(([type, data]: [string, any]) => {
            const category = typeMapping[type.toLowerCase()] || 'others';
            categories[category].size += data.size;
            categories[category].count += data.count;
        });

        // Calculate percentages
        Object.keys(categories).forEach(category => {
            categories[category].percentage = totalSize > 0
                ? (categories[category].size / totalSize) * 100
                : 0;
        });

        // Prepare table data
        const tableData = [
            {
                name: 'Images (JPG, PNG, SVG)',
                extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
                ...categories.images
            },
            {
                name: 'Documents (PDF, DOCX)',
                extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
                ...categories.documents
            },
            {
                name: 'Videos (MP4, MOV)',
                extensions: ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv'],
                ...categories.videos
            },
            {
                name: 'Archives (ZIP, RAR)',
                extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
                ...categories.archives
            },
            {
                name: 'Code & Others',
                extensions: [],
                ...categories.others
            }
        ];

        return {
            categories,
            tableData
        };
    }
}