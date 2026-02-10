import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";

export class MyFileController extends Controller {

    public static get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;

        const pageData = {
            ...Controller.defaultConfig,
            page: 'my-file',
            title: 'My Files - CloudBox',
            currentPath
        };

        response.render('layouts/main', pageData);
    }

}
