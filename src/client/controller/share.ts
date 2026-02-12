import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";

export class ShareController extends Controller {
    public static get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;
        const file = request.query.file as string || '';
        const url = request.query.url as string || '';

        const pageData = {
            ...Controller.defaultConfig,
            page: 'share',
            title: `Share ${file || 'File'} - ${Controller.defaultConfig.title}`,
            currentPath,
            file,
            shareUrl: url
        };
        response.render('layouts/main', pageData);
    }
}
