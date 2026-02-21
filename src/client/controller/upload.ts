import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";

export class UploadController extends Controller {
    public static get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;
        const user = (request as any).user;

        if (!user || (user.role !== "admin" && user.role !== "user")) {
            response.status(403).render('layouts/main', {
                ...Controller.defaultConfig,
                page: 'error',
                title: `Forbidden - ${Controller.defaultConfig.title}`,
                currentPath,
                message: "Author or Admin access required to upload files."
            });
            return;
        }

        const pageData = {
            ...Controller.defaultConfig,
            page: 'upload',
            title: `Upload - ${Controller.defaultConfig.title}`,
            currentPath
        };

        response.render('layouts/main', pageData);
    }
}
