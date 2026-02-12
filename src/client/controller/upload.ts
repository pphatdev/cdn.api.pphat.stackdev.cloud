import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";

export class UploadController extends Controller {
    public static get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;

        const pageData = {
            ...Controller.defaultConfig,
            page: 'upload',
            title: `Upload - ${Controller.defaultConfig.title}`,
            currentPath
        };

        response.render('layouts/main', pageData);
    }
}
