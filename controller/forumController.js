import ErrorHelper from '../helper/errorHelper.js';

async function getForumPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

async function getPostPage(req, res, next) {
    try {
        return res.render("shop/shop");

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

async function getForumPageByCategory(req, res, next) {
    try {
        const category = req.params.category ? req.params.category : "";

        return res.render("shop/shop");

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

async function getForumPageByTag(req, res, next) {
    try {
        const tag = req.params.tag ? req.params.tag : "";

        return res.render("shop/shop");

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

async function getForumPageBySearch(req, res, next) {
    try {
        
    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

async function getAdminForumPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

async function getAdminPostPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

async function getAddPostPage(req, res, next) {
    try {
        
    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

export default {
    getForumPage,
    getPostPage,
    getForumPageByCategory,
    getForumPageByTag,
    getForumPageBySearch,
    getAdminForumPage,
    getAdminPostPage,
    getAddPostPage
}