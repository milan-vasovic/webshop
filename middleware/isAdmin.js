export default (req, res, next) => {
    if (req.session.user?.role !== "admin") {
        return res.redirect('/prijava');
    }
    next();
};
