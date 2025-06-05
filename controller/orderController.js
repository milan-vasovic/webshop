import { validationResult } from "express-validator";
import sanitize from "mongo-sanitize";
import mongoose from "mongoose";

import OrderService from "../service/orderService.js";
import UserService from "../service/userService.js";
import CustomerService from "../service/customerService.js";
import EmailService from "../service/emailService.js";

async function getOrdersPage(req, res, next) {
  try {
    const page = parseInt(sanitize(req.query.page)) || 1;
    const limit = 10;

    const orders = await OrderService.findOrders(limit, page);
    const totalPages = Math.ceil(orders.totalCount / limit);

    return res.render("admin/order/orders", {
      path: "/admin/porudzbine",
      pageTitle: "Porudžbine",
      pageDescription:
        "Prikaz svih porudžbina za administratora sa mogućnošću pretrage!",
      pageKeyWords: "Admin, Porudzbine, Pretraga, Informacije",
      orders: orders,
      currentPage: page,
      totalPages: totalPages,
      basePath: `/admin/porudzbine`,
      index: false,
      featureImage: undefined,
    });
  } catch (error) {
    next(error);
  }
}

async function getTempOrdersPage(req, res, next) {
  try {
    const page = parseInt(sanitize(req.query.page)) || 1;
    const limit = 10;

    const orders = await OrderService.findTempOrders(limit, page);
    const totalPages = Math.ceil(orders.totalCount / limit);

    return res.render("admin/order/temp-orders", {
      path: "/admin/privremene-porudzbine",
      pageTitle: "Porudžbine",
      pageDescription:
        "Prikaz svih porudžbina za administratora sa mogućnošću pretrage!",
      pageKeyWords: "Admin, Porudzbine, Pretraga, Informacije",
      orders: orders,
      currentPage: page,
      totalPages: totalPages,
      basePath: `/admin/pprivremene-orudzbine`,
      index: false,
      featureImage: undefined,
    });
  } catch (error) {
    next(error);
  }
}

async function getSearchOrdersPage(req, res, next) {
  try {
    const page = parseInt(sanitize(req.query.page)) || 1;
    const limit = 10;
    const search = req.params.search ? req.params.search : "";
    
    const param = sanitize(search)
    const orders = await OrderService.findOrdersBySearch(param, limit, page);
    const totalPages = Math.ceil(orders.totalCount / limit);

    return res.render("admin/order/orders", {
      path: "/admin/porudzbine",
      pageTitle: "Porudžbine Pretraga: " + param,
      pageDescription:
        "Prikaz svih porudžbina za administratora sa mogućnošću pretrage!",
      pageKeyWords: "Admin, Porudzbine, Pretraga, Informacije",
      orders: orders,
      currentPage: page,
      totalPages: totalPages,
      basePath: `/admin/porudzbine/pretraga/${search}`,
      index: false,
      featureImage: undefined,
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
      path: "/admin/porudzbina-detalji/" + orderId,
      pageTitle: "Porudžbina Detalji",
      pageDescription: "Prikaz svih detalja porudžbine!",
      pageKeyWords: "Admin, Porudzbina Detalji, Informacije",
      order: order,
      errorMessage: null,
      index: false,
      featureImage: undefined,
    });
  } catch (error) {
    next(error);
  }
}

async function getTempOrderDetailsPage(req, res, next) {
  try {
    const orderId = req.params.orderId;

    const order = await OrderService.findTempOrderById(orderId);

    return res.render("admin/order/temp-order-details", {
      path: "/admin/privremene-porudzbina-detalji/" + orderId,
      pageTitle: "Privremene Porudžbina Detalji",
      pageDescription: "Prikaz svih detalja privremene porudžbine!",
      pageKeyWords: "Admin, Privremena Porudzbina Detalji, Informacije",
      order: order,
      errorMessage: null,
      index: false,
      featureImage: undefined,
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

    return res.redirect(`/admin/porudzbine/pretraga/${search}`);
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
        index: false,
        featureImage: undefined,
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

async function postAdminConfirmOrder(req, res, next) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { token } = req.body;
    const tempOrder = await OrderService.validateTemporaryOrder(token);

    let buyer, customer;

    const existingUser = await UserService.findUserByEmail(tempOrder.email);
    if (existingUser) {
      buyer = { type: 'User', ref: existingUser._id, firstName: tempOrder.buyer.firstName, lastName: tempOrder.buyer.lastName };
    } else {
      customer = await CustomerService.registerNewCustomer(
        tempOrder.buyer.firstName,
        tempOrder.buyer.lastName,
        tempOrder.email,
        tempOrder.telephone,
        tempOrder.address,
        session
      );
      buyer = { type: 'Customer', ref: customer._id, firstName: tempOrder.buyer.firstName, lastName: tempOrder.buyer.lastName };
    }

    const newOrder = await OrderService.createNewOrder(
      buyer,
      tempOrder.email,
      tempOrder.telephone,
      tempOrder.address,
      tempOrder.items,
      tempOrder.totalPrice,
      tempOrder.note,
      session,
      tempOrder.coupon
    );

    if (customer) {
      await CustomerService.updateCustomerOrders(customer._id, newOrder._id, session);
    }

    await EmailService.sendOrderInfo(tempOrder.buyer.firstName, tempOrder.email, newOrder);
    await OrderService.deleteTemporaryOrderById(tempOrder._id, session);

    await session.commitTransaction();

    return res.redirect(`/admin/porudzbina-detalji/${newOrder._id}`);
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
}

export default {
  getOrdersPage,
  getOrderDetailsPage,
  getSearchOrdersPage,
  getTempOrdersPage,
  getTempOrderDetailsPage,
  postOrderSearch,
  postEditOrderStatus,
  postAdminConfirmOrder
};
