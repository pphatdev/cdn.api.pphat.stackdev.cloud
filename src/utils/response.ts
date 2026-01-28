import { Response as ExpressResponse } from "express";

export class Response {

    /**
     * Send success response
     * @param response Express Response
     * @param result Result data
     * @param message Message
     * @param status HTTP status code
    */
    static sendSuccess(response: ExpressResponse, result: any, message = 'Success', status = 200) {
        response.status(status).send({
            status,
            message,
            result,
        });
    }

    /**
     * Send error response
     * @param response Express Response
     * @param error Error data
     * @param message Message
     * @param status HTTP status code
    */
    static sendError(response: ExpressResponse, error: any, message = 'Error', status = 500) {
        response.status(status).send({
            status,
            message,
            error,
        });
    }

    /**
     * Send not found response
     * @param response Express Response
     * @param message Message
     */
    static sendNotFound(response: ExpressResponse, message = 'Not Found') {
        response.status(404).send({
            status: 404,
            message,
        });
    }

    /**
     * Send bad request response
     * @param response Express Response
     * @param message Message
    */
    static sendBadRequest(response: ExpressResponse, message = 'Bad Request') {
        response.status(400).send({
            status: 400,
            message,
        });
    }

    /**
     * Send unauthorized response
     * @param response Express Response
     * @param message Message
    */
    static sendUnauthorized(response: ExpressResponse, message = 'Unauthorized') {
        response.status(401).send({
            status: 401,
            message,
        });
    }

    /**
     * Send forbidden response
     * @param response Express Response
     * @param message Message
    */
    static sendForbidden(response: ExpressResponse, message = 'Forbidden') {
        response.status(403).send({
            status: 403,
            message,
        });
    }
}

export const {
    sendSuccess,
    sendError,
    sendNotFound,
    sendBadRequest,
    sendUnauthorized,
    sendForbidden
} = Response;