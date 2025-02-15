import OrderService from '../service/orderService.js';
import sanitize from 'mongo-sanitize';

async function getOrdersPage(req, res, next) {
    try {
        const search = req.query.search;
        if (search) {
            const orders = await OrderService.findOrders(search);

            return res.render("admin/order/orders", {
                path: "/admin/porudzbine",
                pageTitle: "Porudžbine",
                pageDescription: "Prikaz svih porudžbina za administratora sa mogućnošću pretrage!",
                pageKeyWords: "Admin, Porudzbine, Pretraga, Informacije",
                orders: orders
            })
        }

        const orders = await OrderService.findOrders();

        return res.render("admin/order/orders", {
            path: "/admin/porudzbine",
            pageTitle: "Porudžbine",
            pageDescription: "Prikaz svih porudžbina za administratora sa mogućnošću pretrage!",
            pageKeyWords: "Admin, Porudzbine, Pretraga, Informacije",
            orders: orders
        })

    } catch (error) {
        next(error);
    }
}

async function getOrderDetailsPage(req, res, next) {
    try {
        const orderId = req.params.orderId;
        
        const order = await OrderService.findOrderById(orderId);

        return res.render("admin/order/order-details", {
            path: "/admin/porudzbina-detalji",
            pageTitle: "Porudžbina Detalji",
            pageDescription: "Prikaz svih detalja porudžbine!",
            pageKeyWords: "Admin, Porudzbina Detalji, Informacije",
            order: order
        })

    } catch (error) {
        next(error);
    }
}

async function postOrderSearch(req, res, next) {
    try {
        const search = sanitize(req.body.search);
        if (!search) {
            return res.redirect("/admin/porudzbine");
        }

        return res.redirect(`/admin/porudzbine?search=${search}`);
    } catch (error) {
        next(error)
    }
}
export default {
    getOrdersPage,
    getOrderDetailsPage,
    postOrderSearch
}