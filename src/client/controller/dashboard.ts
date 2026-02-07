import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";

export class DashboardController extends Controller {

    public static get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;

        const dashboardData = {
            ...Controller.defaultConfig,
            currentPath
        };

        response.render('layouts/main', dashboardData);
    }
}