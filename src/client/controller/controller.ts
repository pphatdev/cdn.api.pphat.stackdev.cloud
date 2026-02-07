import { labels, modules } from "../utils/modules.js";

export class Controller {
    static defaultConfig = {
        title: 'CloudBox - Storage Dashboard',
        page: 'dashboard',
        modules,
        labels,
        storageInfo: {
            totalStorage: 200,
            usedStorage: 150,
            freeStorage: 50,
            percentage: 75
        },
        fileTypes: [
            { name: 'Images', size: 60, percentage: 40, color: 'blue' },
            { name: 'Documents', size: 45, percentage: 30, color: 'orange' },
            { name: 'Videos', size: 30, percentage: 20, color: 'green' },
            { name: 'Others', size: 15, percentage: 10, color: 'orange-400' }
        ],
        quickAccess: [
            {
                name: 'Design System',
                size: '4.2 GB',
                files: 21,
                updated: '2h ago',
                type: 'folder',
                icon: 'folder',
                color: 'blue'
            },
            {
                name: 'Marketing Assets',
                size: '12.8 GB',
                files: 348,
                updated: 'yesterday',
                type: 'folder',
                icon: 'image',
                color: 'purple'
            },
            {
                name: 'Contracts & Legal',
                size: '5.1 GB',
                files: 96,
                updated: '5d ago',
                type: 'folder',
                icon: 'file-alt',
                color: 'green'
            },
            {
                name: 'Shared with me',
                size: '4.4 GB',
                files: 58,
                updated: '1h ago',
                type: 'shortcut',
                icon: 'link',
                color: 'blue'
            }
        ],
        fileDetails: [
            {
                type: 'Images (JPG, PNG, SVG)',
                totalFiles: '8,420',
                storageUsed: '60 GB',
                averageSize: '7.3 MB',
                shareOfTotal: '40%',
                icon: 'image',
                iconColor: 'blue'
            },
            {
                type: 'Documents (PDF, DOCX)',
                totalFiles: '3,210',
                storageUsed: '45 GB',
                averageSize: '5.6 MB',
                shareOfTotal: '30%',
                icon: 'file-pdf',
                iconColor: 'red'
            },
            {
                type: 'Videos (MP4, MOV)',
                totalFiles: '640',
                storageUsed: '30 GB',
                averageSize: '4.8 MB',
                shareOfTotal: '20%',
                icon: 'video',
                iconColor: 'purple'
            },
            {
                type: 'Archives (ZIP, RAR)',
                totalFiles: '210',
                storageUsed: '10 GB',
                averageSize: '4.8 MB',
                shareOfTotal: '7%',
                icon: 'file-archive',
                iconColor: 'yellow'
            },
            {
                type: 'Code & Others',
                totalFiles: '1,120',
                storageUsed: '5 GB',
                averageSize: '4.5 MB',
                shareOfTotal: '3%',
                icon: 'code',
                iconColor: 'green'
            }
        ]
    }
}