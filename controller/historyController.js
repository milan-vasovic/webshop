import ErrorHelper from '../helper/errorHelper.js';

async function getHistoryPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

async function getHistoryDetailsPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

export default {
    getHistoryPage,
    getHistoryDetailsPage
}