const ErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const errorMsg = err.message || "Došlo je do greške.";

    return res.status(statusCode).render("error/error", {
        pageTitle: `Greška ${statusCode}`,
        statusCode,
        errorMsg,
        errorDetails: process.env.NODE_ENV === 'development' ? err.stack : null,
        isAuthenticated: req.session?.isLoggedIn || false,
        user: req.session?.user || "guest",
        role: req.session?.user?.role || "guest",
        csrfToken: req.csrfToken ? req.csrfToken() : null,
    });
};

export default ErrorHandler;
