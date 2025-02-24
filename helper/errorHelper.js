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

function throwEmailError() {
    throw new AppError("Neuspešno slanje emaila!", 500);
}

function throwDatabaseError() {
    throw new AppError("Došlo je do greške u bazi podataka!", 500);
}

function throwCryptoError() {
    throw new AppError("Neuspelo generisanje tokena!", 500);
}

function throwAuthenticationError() {
    throw new AppError("Neispravni kredencijali!", 401);
}

export default {
    AppError,
    throwValidationError,
    throwAuthorizationError,
    throwNotFoundError,
    throwConflictError,
    throwServerError,
    throwEmailError,
    throwDatabaseError,
    throwCryptoError,
    throwAuthenticationError
};
