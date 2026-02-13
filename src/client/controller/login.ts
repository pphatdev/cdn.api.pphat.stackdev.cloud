import { Request, Response } from "express";
import { Controller } from "./controller.js";

export class LoginController extends Controller {
    public static get(request: Request, response: Response) {
        const currentPath = request.path;

        const pageData = {
            ...Controller.defaultConfig,
            title: `Login - ${Controller.defaultConfig.title}`,
            page: "login",
            currentPath,
            hideSidebar: true
        };

        response.render("layouts/auth", pageData);
    }
}
