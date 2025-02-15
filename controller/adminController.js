import ErrorHelper from '../helper/errorHelper.js';

async function getDashboardPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

export default {
    getDashboardPage,
}