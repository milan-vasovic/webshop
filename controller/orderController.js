import { validationResult } from "express-validator";
import sanitize from "mongo-sanitize";
import mongoose from "mongoose";

import OrderService from "../service/orderService.js";

async function getOrdersPage(req, res, next) {
  try {
    const search = sanitize(req.query.search);

    if (search) {
      const orders = await OrderService.findOrders(search);

      return res.render("admin/order/orders", {
        path: "/admin/porudzbine",
        pageTitle: "Porudžbine",
        pageDescription:
          "Prikaz svih porudžbina za administratora sa mogućnošću pretrage!",
        pageKeyWords: "Admin, Porudzbine, Pretraga, Informacije",
        orders: orders,
      });
    }

    const orders = await OrderService.findOrders();

    return res.render("admin/order/orders", {
      path: "/admin/porudzbine",
      pageTitle: "Porudžbine",
      pageDescription:
        "Prikaz svih porudžbina za administratora sa mogućnošću pretrage!",
      pageKeyWords: "Admin, Porudzbine, Pretraga, Informacije",
      orders: orders,
    });
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
      errorMessage: null,
    });
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
    next(error);
  }
}

async function postEditOrderStatus(req, res, next) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const orderId = sanitize(req.body.orderId);
    const status = sanitize(req.body.status);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const order = await OrderService.findOrderById(orderId);
      await session.abortTransaction();
      session.endSession();
      return res.status(422).render("admin/order/order-details", {
        path: "/admin/porudzbina-detalji",
        pageTitle: "Porudžbina Detalji",
        pageDescription: "Prikaz svih detalja porudžbine!",
        pageKeyWords: "Admin, Porudzbina Detalji, Informacije",
        order: order,
        errorMessage: errors.array()[0].msg,
      });
    }

    let exchangedOrderId;
    if (status === "sent-exchange") {
      exchangedOrderId = sanitize(req.body.newOrderId);
    }

    const updatedOrder = await OrderService.updateOrderStatus(
      orderId,
      status,
      exchangedOrderId,
      session
    );

    await session.commitTransaction();
    session.endSession();

    return res.redirect(`/admin/porudzbina-detalji/${updatedOrder._id}`);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  } finally {
    session.endSession();
  }
}

export default {
  getOrdersPage,
  getOrderDetailsPage,
  postOrderSearch,
  postEditOrderStatus,
};
