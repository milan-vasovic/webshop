import OrderModel from "../model/order.js";
import TemporaryOrderModel from "../model/temporaryOrder.js";

import CryptoService from "./cryptoService.js";
import ItemService from "./itemService.js";

import ErrorHelper from "../helper/errorHelper.js";
import EmailService from "./emailService.js";
import UserService from "./userService.js";
import CustomerService from "./customerService.js";

class OrderService {
  /**
   * Creates a new order.
   *
   * @param {Object} buyer - The buyer information.
   * @param {string} telephone - The buyer's telephone number.
   * @param {Object} address - The shipping address.
   * @param {Array<Object>} items - The items in the order.
   * @param {number} totalPrice - The total price of the order.
   * @param {Object} session - The mongoose session object.
   * @param {Object} [coupon] - The coupon applied to the order (optional).
   * @returns {Promise<Object>} - A promise that resolves to the created order.
   */
  static async createNewOrder(
    buyer,
    email,
    telephone,
    address,
    items,
    totalPrice,
    note,
    session,
    coupon = undefined
  ) {
    try {
      const newShipping = process.env.SHIPPING_PRICE;

      const newOrder = new OrderModel({
        buyer: {
          type: buyer.type,
          ref: buyer.ref,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          email: email,
        },
        telephone: telephone,
        items: items,
        address: address,
        shipping: newShipping,
        totalPrice: totalPrice,
        note: note,
        coupon: coupon,
      });

      await newOrder.save({ session });

      await Promise.all(
        items.map((item) =>
          ItemService.updateItemAmountById(
            item.itemId,
            item.amount,
            item.variationId,
            session
          )
        )
      );

      return newOrder;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async createNewTemporaryOrder(
    buyer,
    email,
    telephone,
    address,
    items,
    totalPrice,
    note,
    session = undefined,
    coupon = undefined,
    createNewAccount = false,
    hasNewTelephone = false,
    hasNewAddress = false
  ) {
    try {
      let newAccount = false;
      if (createNewAccount === "on") {
        newAccount = true;
      }

      const newItems = items.map((item) => ({
        itemId: item.ID.value,
        variationId: item["Variacija ID"].value,
        title: item.Artikal.value,
        size: item.Veličina.value,
        color: item.Boja.value,
        price: item.Cena.value,
        amount: item.Količina.value,
        image: item.Slika.value,
        code: item.Kod.value,
      }));

      const newAddress = {
        city: address.Adresa.Grad,
        street: CryptoService.encryptData(address.Adresa.Ulica),
        number: CryptoService.encryptData(address.Adresa.Broj),
        postalCode: address.Adresa["Poštanski Broj"],
      };

      const newShipping = process.env.SHIPPING_PRICE;
      const newTotalPrice =
      (Number(totalPrice) + Number(newShipping)) - ((Number(totalPrice) + Number(newShipping)) *
      (Number(coupon?.discount || 0) / 100));

      const verificationToken = await CryptoService.createToken();
      const tokenExpiration = Date.now() + 2 * 24 * 60 * 60 * 1000;

      const newTemoraryOrder = new TemporaryOrderModel({
        buyer: {
          type: buyer.type,
          firstName: buyer.firstName,
          lastName: CryptoService.encryptData(buyer.lastName),
        },
        email: email,
        telephone: CryptoService.encryptData(telephone),
        items: newItems,
        address: newAddress,
        shipping: newShipping,
        totalPrice: newTotalPrice,
        note: CryptoService.encryptData(note),
        coupon: coupon,
        verificationToken: verificationToken,
        tokenExpiration: tokenExpiration,
        createNewAccount: newAccount,
        hasNewTelephone: hasNewTelephone,
        hasNewAddress: hasNewAddress,
      });

      return await newTemoraryOrder.save({ session });
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async validateTemporaryOrder(token) {
    try {
      const tempOrder = await TemporaryOrderModel.findOne({
        verificationToken: token,
      });

      if (!tempOrder) {
        return {
          success: false,
          message: "Nije moguće validirati porudžbinu!",
        };
      }

      if (Date.now() > tempOrder.tokenExpiration) {
        return { success: false, message: "Porudžbina je istekla!" };
      }

      return tempOrder;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Finds orders based on a search query, with pagination.
   *
   * @param {string|null} [search] - The search query to filter orders by (optional).
   * @param {number} [limit=10] - The maximum number of orders to return.
   * @param {number} [skip=0] - The number of orders to skip.
   * @returns {Promise<Array>} - A promise that resolves to an array of orders.
   */
  static async findOrders(limit = 10, page = 1) {
    try {
      const skip = (page - 1) * limit;
      const orders = await OrderModel.find().sort({ date: -1 }).skip(skip).limit(limit);

      if (!orders) {
        ErrorHelper.throwNotFoundError("Porudžbine");
      }

      const totalCount = await OrderModel.countDocuments({});
      return {
        orders: this.mapOrders(orders),
        totalCount: totalCount
      };
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findTempOrders(limit = 10, page = 1) {
    try {
      const skip = (page - 1) * limit;
      const tempOrders = await TemporaryOrderModel.find().sort({ date: -1 }).skip(skip).limit(limit);
      if (!tempOrders) {
        ErrorHelper.throwNotFoundError("Porudžbine");
      }

      const totalCount = await TemporaryOrderModel.countDocuments({});
      return {
        orders: this.mapOrders(tempOrders),
        totalCount: totalCount
      };
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findOrdersBySearch(search, limit = 10, page = 1) {
    try {
      const skip = (page - 1) * limit;
      let orders;
      let matchStage = {}; // Ovde više ne koristimo samo $or

      const searchQuery = search ? search.trim() : null;

      if (searchQuery) {
        let dateFilter = null;
        const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;

        // Proveravamo da li je unos u formatu DD.MM.YYYY
        if (dateRegex.test(searchQuery)) {
          const [day, month, year] = searchQuery.split(".").map(Number);

          // Kreiramo tačan opseg vremena za taj dan
          const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
          const endOfDay = new Date(
            Date.UTC(year, month - 1, day, 23, 59, 59, 999)
          );

          dateFilter = {
            $gte: startOfDay, // Početak dana u UTC
            $lt: endOfDay, // Kraj dana u UTC
          };

          // Ako korisnik pretražuje datum, NE koristimo $or
          matchStage.date = dateFilter;
        } else {
          // Ako nije datum, formiramo klasičan $or upit
          matchStage.$or = [
            { _id: { $regex: searchQuery, $options: "i" } }, // Pretraga po ID-u
            { "buyer.firstName": { $regex: searchQuery, $options: "i" } }, // Po imenu kupca
            { status: { $regex: searchQuery, $options: "i" } }, // Po statusu narudžbine
          ];

          // Ako je unet broj (npr. za cenu narudžbine), dodajemo pretragu po totalPrice
          if (!isNaN(searchQuery)) {
            matchStage.$or.push({ totalPrice: parseFloat(searchQuery) });
          }
        }
      }

      // Pipeline za agregaciju sa pretragom i formatiranjem podataka
      const pipeline = [
        { $match: matchStage },
        { $sort: { date: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            "buyer.type": 1,
            "buyer.firstName": 1,
            date: {
              $dateToString: {
                format: "%d.%m.%Y",
                date: "$date",
                timezone: "Europe/Belgrade",
              },
            },
            totalPrice: {
              $concat: [{ $toString: "$totalPrice" }],
            },
            status: 1,
          },
        },
      ];

      const countPipeline = [
        { $match: matchStage },
        { $count: "totalCount" },
      ];
      
      orders = await OrderModel.aggregate(pipeline);
      const countResult = await OrderModel.aggregate(countPipeline);
      const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;
  
      return {
        orders: this.mapOrders(orders),
        totalCount,
      };
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Finds an order by its ID.
   *
   * @param {string} orderId - The ID of the order to find.
   * @returns {Promise<Object>} - A promise that resolves to the order details.
   */
  static async findOrderById(orderId) {
    try {
      const order = await OrderModel.findById(orderId);

      if (!order) {
        ErrorHelper.throwNotFoundError("Porudžbina");
      }

      return this.mapOrderDetails(order);
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findTempOrderById(orderId) {
    try {
      const order = await TemporaryOrderModel.findById(orderId);

      if (!order) {
        ErrorHelper.throwNotFoundError("Porudžbina");
      }

      return this.mapTempOrderDetails(order);
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Finds the details of a user's order by order ID and user ID.
   *
   * @param {string} orderId - The ID of the order to find.
   * @param {string} userId - The ID of the user to verify ownership.
   * @returns {Promise<Object>} - A promise that resolves to the order details.
   */
  static async findUserOrderDetails(orderId, userId) {
    try {
      const order = await OrderModel.findById(orderId);

      if (!order) {
        ErrorHelper.throwNotFoundError("Porudžbina");
      }

      if (order.buyer.ref._id.toString() !== userId.toString()) {
        ErrorHelper.throwConflictError("Nemate pravo pristupa!");
      }

      return this.mapOrderDetails(order);
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async updateOrderStatus(
    orderId,
    status,
    session,
    exchangedOrderId = null
  ) {
    try {
      const order = await OrderModel.findById(orderId);

      if (!order) {
        ErrorHelper.throwNotFoundError("Porudžbina");
      }

      switch (status) {
        case "pending-payment":
          // Need to sent email to user that will inform them that order is sent
          order.refundDate = undefined;

          await EmailService.notifyUserThatOrderIsSent(
            order.buyer.firstName,
            order.buyer.email,
            order._id
          );
          break;
        case "sent-exchange":
          if (exchangedOrderId) {
            // Need to sent email to user that will inform them that order is sent
            order.exchangedOrderId = exchangedOrderId;
          }
          order.refundDate = undefined;
          break;

        case "refund-period":
          const today = new Date();
          const futureDate = new Date();
          futureDate.setDate(today.getDate() + 14);
          order.refundDate = futureDate;
          break;
        case "fulfilled":
          order.refundDate = undefined;

          await Promise.all(
            order.items.map(async (item) => {
              await ItemService.changeItemSoldCount(
                item.itemId,
                item.amount,
                session
              );
            })
          );
          break;
        case "returned":
          // add item variation amount number to cooresponding item variation
          order.refundDate = undefined;

          // Increment amount of returnedCount in item
          await Promise.all(
            order.items.map(async (item) => {
              await ItemService.changeItemReturnedCount(
                item.itemId,
                item.amount,
                session
              );
              await ItemService.changeItemSoldCount(
                item.itemId,
                -item.amount,
                session
              );
              await ItemService.changeVariationAmount(
                item.itemId,
                item.size,
                item.color,
                item.amount,
                session
              );
            })
          );

          await EmailService.notifyUserThatOrderIsReturned(
            order.buyer.firstName,
            order.buyer.email,
            order._id
          );

          break;
        case "cancelled":
          order.refundDate = undefined;

          // add item variation amount number to cooresponding item variation
          await Promise.all(
            order.items.map(async (orderItem) => {
              await ItemService.changeVariationAmount(
                orderItem.itemId,
                orderItem.size,
                orderItem.color,
                orderItem.amount,
                session
              );
            })
          );

          await EmailService.notifyUserThatOrderIsCancelled(
            order.buyer.firstName,
            order.buyer.email,
            order._id
          );

          break;
        case "failed":
          // add item variation amount number to cooresponding item variation
          await Promise.all(
            order.items.map(async (orderItem) => {
              await ItemService.changeVariationAmount(
                orderItem.itemId,
                orderItem.size,
                orderItem.color,
                orderItem.amount,
                session
              );
            })
          );

          order.refundDate = undefined;
          break;
        default:
          order.refundDate = undefined;
          break;
      }

      order.status = status;

      return await order.save();
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async updateOrderBuyerRef(orderId, userId, session) {
    try {
      const order = await OrderModel.findById(orderId).select("buyer");

      order.buyer.ref = userId;
      return await order.save({ session });
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async cancelOrder(orderId, userId) {
    try {
      const order = await OrderModel.findOneAndUpdate(
        { _id: orderId, "buyer.ref": userId },
        { $set: { status: "cancelled" } },
        { new: true }
      );

      if (!order) {
        ErrorHelper.throwNotFoundError("Porudzbina");
      }
      const userInfo = await UserService.findUserEmailById(userId);

      EmailService.notifyUserThatOrderIsCancelled(
        userInfo.firstName,
        userInfo.email,
        order._id
      );
      return order;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async deleteTemporaryOrderById(id, session) {
    try {
      const order = await TemporaryOrderModel.deleteOne({
        _id: id,
      }).session(session);
      return order;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Maps orders to a specific format for display.
   *
   * @param {Array<Object>} orders - The array of orders to map.
   * @returns {Array<Object>} - An array of mapped orders.
   */
  static mapOrders(orders) {
    return orders.map((order) => ({
      ID: { value: order._id },
      Tip: { value: order.buyer.type },
      Kupac: { value: order.buyer.firstName },
      Datum: {
        value: order.date.toLocaleDateString("sr-RS", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      },
      "Ukupna Cena": { value: `${order.totalPrice} RSD` },
      Status: { value: order.status },
    }));
  }

  /**
   * Maps order details to a specific format for display.
   *
   * @param {Object} order - The order object to map.
   * @returns {Object} - The mapped order details.
   */
  static mapOrderDetails(order) {
    return {
      ID: { value: order._id },
      Kupac: {
        Tip: { value: order.buyer.type },
        Ime: { value: order.buyer.firstName },
        Prezime: { value: CryptoService.decryptData(order.buyer.lastName) },
        ID: { value: order.buyer.ref._id },
        Email: { value: order.buyer.email },
      },
      Datum: {
        value: order.date.toLocaleDateString("sr-RS", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      },
      Poštarina: { value: order.shipping },
      Kupon: {
        Kod: { value: order.coupon.code },
        Popust: { value: `${order.coupon.discount} %` },
      },
      "Ukupna Cena": { value: `${order.totalPrice} RSD` },
      Artikli: order.items.map((item) => ({
        Slika: { value: item.image },
        Naziv: item.title,
        Velicina: item.size,
        Količina: item.amount,
        Boja: item.color,
      })),

      Telefon: { value: CryptoService.decryptData(order.telephone) },
      Adresa: {
        Grad: { value: order.address.city },
        Ulica: { value: CryptoService.decryptData(order.address.street) },
        Broj: { value: CryptoService.decryptData(order.address.number) },
        "Poštanski Broj": { value: order.address.postalCode },
      },
      Napomena: { value: CryptoService.decryptData(order.note) || "Nema" },
      Status: { value: order.status },
    };
  }

  static mapTempOrderDetails(tempOrder) {
  return {
    ID: { value: tempOrder._id },
    Token: { value: tempOrder.verificationToken },
    Kupac: {
      Tip: { value: tempOrder.buyer.type },
      Ime: { value: tempOrder.buyer.firstName },
      Prezime: {
        value: CryptoService.decryptData(tempOrder.buyer.lastName),
      },
      Email: { value: tempOrder.email },
    },
    Datum: {
      value: tempOrder.date.toLocaleDateString("sr-RS", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    },
    Poštarina: { value: tempOrder.shipping },
    Kupon: {
      Kod: { value: "Nema" },
      Popust: { value: "0 %" },
    },
    "Ukupna Cena": { value: `${tempOrder.totalPrice} RSD` },
    Artikli: tempOrder.items.map((item) => ({
      Slika: { value: item.image },
      Naziv: item.title,
      Velicina: item.size,
      Količina: item.amount,
      Boja: item.color,
    })),

    Telefon: { value: CryptoService.decryptData(tempOrder.telephone) },
    Adresa: {
      Grad: { value: tempOrder.address.city },
      Ulica: {
        value: CryptoService.decryptData(tempOrder.address.street),
      },
      Broj: {
        value: CryptoService.decryptData(tempOrder.address.number),
      },
      "Poštanski Broj": { value: tempOrder.address.postalCode },
    },
    Napomena: {
      value: CryptoService.decryptData(tempOrder.note) || "Nema",
    },
    Status: { value: "Privremena" },
  };
}

}

export default OrderService;
