import OrderModel from "../model/order.js";

import CryptoService from "./cryptoService.js";
import ItemService from "./itemService.js";

import ErrorHelper from "../helper/errorHelper.js";

class OredrService {
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
    telephone,
    address,
    items,
    totalPrice,
    session,
    coupon = undefined
  ) {
    try {
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
        (Number(totalPrice) + Number(newShipping)) *
        (Number(coupon?.discount || 100) / 100);

      const newOrder = new OrderModel({
        buyer: {
          type: buyer.type,
          ref: buyer.ref,
          firstName: buyer.firstName,
          lastName: CryptoService.encryptData(buyer.lastName),
        },
        telephone: CryptoService.encryptData(telephone),
        items: newItems,
        address: newAddress,
        shipping: newShipping,
        totalPrice: newTotalPrice,
        coupon: coupon,
      });

      await newOrder.save({ session });

      await Promise.all(
        newItems.map((item) =>
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

  /**
   * Finds orders based on a search query, with pagination.
   *
   * @param {string|null} [search] - The search query to filter orders by (optional).
   * @param {number} [limit=10] - The maximum number of orders to return.
   * @param {number} [skip=0] - The number of orders to skip.
   * @returns {Promise<Array>} - A promise that resolves to an array of orders.
   */
  static async findOrders(search = null, limit = 10, skip = 0) {
    try {
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

      orders = await OrderModel.aggregate(pipeline);

      return this.mapOrders(orders);
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

  static async updateOrderById(orderId, status) {
    try {
      const order = await OrderModel.findOneAndUpdate(
        { _id: orderId },
        { status },
        { new: true }
      );

      if (!order) {
        ErrorHelper.throwNotFoundError("Porudžbina");
      }

      return order;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async sendOrderById(orderId, session) {
    try {
      
    } catch (error) {
      
    }
  }

  static async realizeOrderById(orderId, session) {
    try {
      
    } catch (error) {
      
    }
  }

  static async failOrderById(orderId, session) {
    try {
      
    } catch (error) {
      
    }
  }

  static async cancelOrderById(orderId, session) {
    try {
      
    } catch (error) {
      
    }
  }

  static async returnOrderById(orderId, session) {
    try {
      
    } catch (error) {
      
    }
  }
  
  static async exchangeOrderById(orderId, newItemsId, session) {
    try {
      
    } catch (error) {
      
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
        value: order.date,
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
      Status: { value: order.status },
    };
  }
}

export default OredrService;
