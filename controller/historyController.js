async function getHistoryPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        next(error)
    }
}

async function getHistoryDetailsPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        next(error)
    }
}

export default {
    getHistoryPage,
    getHistoryDetailsPage
}