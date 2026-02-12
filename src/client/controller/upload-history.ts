import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";

export class UploadHistoryController extends Controller {
    public static get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;

        const pageData = {
            ...Controller.defaultConfig,
            page: 'upload-history',
            title: `Upload History - ${Controller.defaultConfig.title}`,
            currentPath
        };

        response.render('layouts/main', pageData);
    }
}
