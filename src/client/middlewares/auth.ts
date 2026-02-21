import { NextFunction, Request, Response } from "express";
import { AuthController } from "../../server/controllers/auth.controller.js";
import { Controller } from "../controller/controller.js";

const PUBLIC_PATHS = new Set(["/login"]);
const PUBLIC_PREFIXES = ["/styles", "/utils", "/api", "/favicon", "/apple-touch-icon"];

const parseCookies = (cookieHeader?: string): Record<string, string> => {
    if (!cookieHeader) return {};

    return cookieHeader.split(";").reduce((acc, cookie) => {
        const [rawKey, ...rest] = cookie.trim().split("=");
        if (!rawKey) return acc;
        acc[rawKey] = decodeURIComponent(rest.join("=") || "");
        return acc;
    }, {} as Record<string, string>);
};

const renderLogin = (req: Request, res: Response) => {
    const pageData = {
        ...Controller.defaultConfig,
        title: `Login - ${Controller.defaultConfig.title}`,
        page: "login",
        currentPath: req.path,
        returnTo: req.originalUrl || "/",
        hideSidebar: true
    };

    res.status(401).render("layouts/auth", pageData);
};

export const clientAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (PUBLIC_PATHS.has(req.path) || PUBLIC_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
        next();
        return;
    }

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.accessToken;

    if (!token) {
        renderLogin(req, res);
        return;
    }

    const payload = await AuthController.validateToken(token);

    if (!payload) {
        renderLogin(req, res);
        return;
    }

    const user = {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
        sessionId: payload.sessionId
    };

    (req as any).user = user;
    res.locals.user = user;

    next();
};
