class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

function throwValidationError(field) {
    throw new AppError(`Polje '${field}' nije validno!`, 400);
}

function throwAuthorizationError() {
    throw new AppError("Nemate pravo pristupa ovom resursu!", 403);
}

function throwNotFoundError(entity) {
    throw new AppError(`${entity} nije pronađen!`, 404);
}

function throwConflictError(entity) {
    throw new AppError(`Postoji konflikt sa ${entity}`, 409);
}

function throwServerError(err) {
    throw new AppError(`Greška na serveru! ${err.message || err}`, 500);
}

export default {
    AppError,
    throwValidationError,
    throwAuthorizationError,
    throwNotFoundError,
    throwConflictError,
    throwServerError
}