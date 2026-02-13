import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";

export class UsersController extends Controller {

    public static async get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;

        try {
            // Render users page
            const usersData = {
                ...Controller.defaultConfig,
                title: `Users Management - ${Controller.defaultConfig.title}`,
                page: 'users',
                currentPath
            };

            response.render('layouts/main', usersData);
        } catch (error) {
            console.error('Error loading users page:', error);

            // Render with error state
            const usersData = {
                ...Controller.defaultConfig,
                title: `Users Management - ${Controller.defaultConfig.title}`,
                page: 'users',
                currentPath,
                error: 'Failed to load users page'
            };

            response.render('layouts/main', usersData);
        }
    }
}
