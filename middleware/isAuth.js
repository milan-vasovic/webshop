import authController from "../controller/authController.js";

export default (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect(`/prijava?redirectTo=${encodeURIComponent(req.originalUrl)}`);
    }

    if (req.session.user?.status && !req.session.user.status.includes("active")) {
        return authController.postLogout(req, res, next);
    }

    next();
};
