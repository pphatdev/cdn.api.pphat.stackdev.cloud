/**
 * Application Mine types
*/
export const appMimeTypes: string[] = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

/**
 * Image MIME types
 */
export const imageMimeTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/tiff',
    'image/bmp',
    'image/svg+xml'
];


/**
 * Audio MIME types
*/
export const audioMimeTypes: string[] = [
    'audio/m4a',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav'
];


/**
 * Video MIME types
*/
export const videoMimeTypes: string[] = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv'
];


export const getMimeType = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
        // Documents (from appMimeTypes)
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Audio (from audioMimeTypes)
        'm4a': 'audio/m4a',
        'mp4a': 'audio/mp4',
        'wav': 'audio/wav',
        // Video (from videoMimeTypes)
        'mp4': 'video/mp4',
        'mpeg': 'video/mpeg',
        'mpg': 'video/mpeg',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'wmv': 'video/x-ms-wmv',
        // Text
        'txt': 'text/plain',
        'csv': 'text/csv',
        'html': 'text/html',
        'htm': 'text/html',
        'css': 'text/css',
        'js': 'text/javascript',
        // Archives
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
        // Data
        'json': 'application/json',
        'xml': 'application/xml',

        ...videoMimeTypes.reduce((acc, type) => {
            const extension = type.split('/')[1];
            acc[extension] = type;
            return acc;
        }, {} as Record<string, string>),

        ...appMimeTypes.reduce((acc, type) => {
            const extension = type.split('/')[1];
            acc[extension] = type;
            return acc;
        }, {} as Record<string, string>),

        ...imageMimeTypes.reduce((acc, type) => {
            const extension = type.split('/')[1];
            acc[extension] = type;
            return acc;
        }, {} as Record<string, string>),

        ...audioMimeTypes.reduce((acc, type) => {
            const extension = type.split('/')[1];
            acc[extension] = type;
            return acc;
        }, {} as Record<string, string>),

    };
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}