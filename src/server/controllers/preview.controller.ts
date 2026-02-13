import { Request, Response } from "express";
import { configured } from "../utils/config.js";
import { sendNotFound } from "../utils/response.js";
import { FilesController } from './files.controller.js';
import { findFileInDirectories } from "../utils/directories.js";
import fs from 'fs';

export class PreviewController {

    static files = async (request: Request, response: Response): Promise<void> => {
        const { filename } = request.params;
        const ext = (filename as string).split('.').pop()?.toLowerCase();

        // const previewableExtensions = [
        //     'docx',
        //     'doc',
        // ];

        // if (ext && previewableExtensions.includes(ext)) {
        //     return PreviewController.docx(request, response);
        // }
        return PreviewController.all(request, response);

    }

    /**
     * Preview a file by filename
     * @param request Request
     * @param response Response
    */
    static all = async (request: Request, response: Response): Promise<void> => {
        const { filename } = request.params;
        // find the file in configured directories
        const fullPath = await findFileInDirectories(filename as string);

        if (fullPath) {

            // Sync file when accessed and wait for completion
            await FilesController.syncFile(fullPath);
            const fileStream = fs.createReadStream(fullPath);
            fileStream.pipe(response);
            return;
        }
        sendNotFound(response, 'File not found.');
    };

    /**
     * Preview DOCX file by filename
     * @param request Request
     * @param response Response
     **/
    static docx = async (request: Request, response: Response): Promise<void> => {
        const { filename } = request.params;
        // find the file in configured directories
        const storage = configured.directories;
        for (const dir of storage) {
            const filePath = `${dir}/${filename}`.replace(/\\/g, '/');
            if (fs.existsSync(filePath)) {
                // Sync file when accessed and wait for completion
                await FilesController.syncFile(filePath);

                // Read file with fs.promises to ensure we get the latest content
                const fileBuffer = await fs.promises.readFile(filePath);
                const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

                // Ensure the data is in the correct format
                const uint8Array = new Uint8Array(arrayBuffer);

                const htmlContent = (`
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                            <script crossorigin src="https://unpkg.com/jszip/dist/jszip.min.js"></script>
                            <script src="https://volodymyrbaydalka.github.io/docxjs/dist/docx-preview.js"></script>
                            <script src="https://cdn.tailwindcss.com"></script>
                        </head>

                        <body class="h-screen flex justify-center bg-slate-100">
                            <div id="document-container"></div>
                            <script>
                                const docxOptions = Object.assign(docx.defaultOptions, {
                                    debug: true,
                                    experimental: true,
                                    hideWrapperOnPrint: true
                                });

                                async function renderDocxFromBuffer(buffer) {
                                    if (!buffer) return;
                                    // render document
                                    await docx.renderAsync(new Blob([buffer]), document.querySelector("#document-container"), null, docxOptions);
                                }

                                // Render the document immediately
                                const fileBuffer = new Uint8Array(${JSON.stringify(Array.from(uint8Array))});
                                renderDocxFromBuffer(fileBuffer);
                            </script>
                        </body>
                    </html>
                `);

                // Send the HTML content as a response
                response.setHeader('Content-Type', 'text/html');
                response.send(htmlContent);
                return;
            }
        }

        sendNotFound(response, 'File not found.');
    };
}