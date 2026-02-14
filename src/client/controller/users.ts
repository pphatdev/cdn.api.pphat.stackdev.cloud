import { NextFunction, Request, Response } from "express";
import { Controller } from "./controller.js";
import { getDbClient } from "../../server/utils/db.js";

export class UsersController extends Controller {

    public static async get(request: Request, response: Response, next: NextFunction) {
        const currentPath = request.path;

        try {
            const user = (request as any).user;
            if (!user || user.role !== "admin") {
                const usersData = {
                    ...Controller.defaultConfig,
                    title: `Users Management - ${Controller.defaultConfig.title}`,
                    page: "users",
                    currentPath,
                    users: [],
                    usersError: "Admin access required."
                };

                response.status(403).render("layouts/main", usersData);
                return;
            }

            const sql = getDbClient();
            const usersResult = await sql`
                SELECT
                    id, username, email, name, avatar, role,
                    is_active, last_login_at, created_at, updated_at
                FROM users
                ORDER BY created_at DESC
            `;

            const users = usersResult.map((userRow: any) => ({
                id: userRow.id,
                username: userRow.username,
                email: userRow.email,
                name: userRow.name,
                avatar: userRow.avatar,
                role: userRow.role,
                is_active: userRow.is_active,
                last_login_at: userRow.last_login_at,
                created_at: userRow.created_at,
                updated_at: userRow.updated_at
            }));

            // Render users page
            const usersData = {
                ...Controller.defaultConfig,
                title: `Users Management - ${Controller.defaultConfig.title}`,
                page: 'users',
                currentPath,
                users,
                usersError: ""
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
                users: [],
                usersError: 'Failed to load users page'
            };

            response.render('layouts/main', usersData);
        }
    }
}
