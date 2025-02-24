import sanitize from 'mongo-sanitize';

import OrderService from '../service/orderService.js';

async function getOrdersPage(req, res, next) {
    try {
        const search = sanitize(req.query.search);
        
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
            order: order,
            errorMessage: null
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

async function postEditOrderStatus(req, res, next) {
    try {
        const orderId = sanitize(req.body.orderId);
        const status = sanitize(req.body.status);

        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            const order = await OrderService.findOrderById(orderId);
            
            return res.status(422).render("admin/order/order-details", {
                path: "/admin/porudzbina-detalji",
                pageTitle: "Porudžbina Detalji",
                pageDescription: "Prikaz svih detalja porudžbine!",
                pageKeyWords: "Admin, Porudzbina Detalji, Informacije",
                order: order,
                errorMessage: errors.array()[0].msg
            });
        }

        const updatedOrder = await OrderService.updateOrderStatus(orderId, status);

        return res.redirect(`/admin/porudzbina-detalji/${updatedOrder._id}`);
    } catch (error) {
        next(error);
    }
}

export default {
    getOrdersPage,
    getOrderDetailsPage,
    postOrderSearch,
    postEditOrderStatus
}