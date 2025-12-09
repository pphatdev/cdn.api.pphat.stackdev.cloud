import fs from 'fs-extra';
import path from 'path';

export class ImageCache {
    private static readonly cacheDir: string = '.cache-local/images';
    private static readonly ttl: number = 3600; // 1 hour default

    static init(): void {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    static getCacheFilePath(key: string, extension: string = ''): string {
        return path.join(this.cacheDir, `${key}${extension}`);
    }

    static async saveImage(key: string, imageBuffer: Buffer, extension: string): Promise<boolean> {
        try {
            this.init();
            const filePath = this.getCacheFilePath(key, extension);
            const metadata = {
                timestamp: Date.now(),
                ttl: this.ttl,
                extension
            };

            // Save the image
            await fs.writeFile(filePath, imageBuffer);

            // Save metadata separately
            await fs.writeJson(this.getCacheFilePath(key, '.meta.json'), metadata);

            return true;
        } catch (error) {
            console.error('Error saving image:', error);
            return false;
        }
    }

    static async getImage(key: string, extension?: string): Promise<Buffer | null> {
        try {
            const metaPath = this.getCacheFilePath(key, '.meta.json');
            if (!fs.existsSync(metaPath)) return null;

            const metadata = await fs.readJson(metaPath);
            const age = (Date.now() - metadata.timestamp) / 1000;

            if (age > metadata.ttl) {
                await this.deleteImage(key, metadata.extension);
                return null;
            }

            const imagePath = this.getCacheFilePath(key, extension || metadata.extension);
            if (!fs.existsSync(imagePath)) return null;

            return await fs.readFile(imagePath);
        } catch (error) {
            console.error('Error reading image:', error);
            return null;
        }
    }

    static async deleteImage(key: string, extension?: string): Promise<void> {
        try {
            const metaPath = this.getCacheFilePath(key, '.meta.json');
            if (fs.existsSync(metaPath)) {
                const metadata = await fs.readJson(metaPath);
                const imagePath = this.getCacheFilePath(key, extension || metadata.extension);

                await fs.unlink(imagePath).catch(() => { });
                await fs.unlink(metaPath).catch(() => { });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }
}