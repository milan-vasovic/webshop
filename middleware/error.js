const ErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const errorMsg = err.message || "Došlo je do greške.";
    const cartItemCount = req.session?.cartItemCount || 0;
    return res.status(statusCode).render("error/error", {
        path: "/error",
        pageTitle: `Greška ${statusCode}`,
        pageDescription: `Došlo je do greške na stranici (${statusCode}) – ${errorMsg}`,
        pageKeyWords: `greška, error ${statusCode}, problem, stranica, neuspeh`,
        statusCode,
        errorMsg,
        errorDetails: process.env.NODE_ENV === 'development' ? err.stack : null,
        cartItemCount,
        isAuthenticated: req.session?.isLoggedIn || false,
        user: req.session?.user || "guest",
        role: req.session?.user?.role || "guest",
        csrfToken: req.csrfToken ? req.csrfToken() : null,
        index: false,
        featureImage: undefined,
    });
};

export default ErrorHandler;
