import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";

export class DetailController extends Controller {
    public static get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;
        const file = request.query.file as string || '';

        const pageData = {
            ...Controller.defaultConfig,
            page: 'detail',
            title: `${file || 'File'} Details - ${Controller.defaultConfig.title}`,
            currentPath,
            file
        };
        response.render('layouts/main', pageData);
    }
}
