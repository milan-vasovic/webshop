import ErrorHelper from "../helper/errorHelper.js";
import OrderModel from "../model/order.js";
import CryptoService from "./cryptoService.js";
import dotenv from 'dotenv';
import ItemService from "./itemService.js";
import UserService from "./userService.js";
dotenv.config();

class OredrService {
    static async createNewOrder(buyer, telephone, address, items, totalPrice, session, coupon = undefined) {
        try {
          const newItems = items.map((item) => ({
            itemId: item.ID.value,
            variationId: item['Variacija ID'].value,
            title: item.Artikal.value,
            size: item.Veličina.value,
            color: item.Boja.value,
            price: item.Cena.value,
            amount: item.Količina.value,
            image: item.Slika.value,
            code: item.Kod.value
          }));
      
          const newAddress = {
            city: address.Adresa.Grad,
            street: CryptoService.encryptData(address.Adresa.Ulica),
            number: CryptoService.encryptData(address.Adresa.Broj),
            postalCode: address.Adresa["Poštanski Broj"]
          };
      
          const newShipping = process.env.SHIPPING_PRICE;
          const newTotalPrice = (Number(totalPrice) + Number(newShipping)) * (Number(coupon?.discount || 100) / 100);
      
          const newOrder = new OrderModel({
            buyer: {
              type: buyer.type,
              ref: buyer.ref,
              firstName: buyer.firstName,
              lastName: CryptoService.encryptData(buyer.lastName)
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
            newItems.map(item =>
              ItemService.updateItemAmountById(item.itemId, item.amount, item.variationId, session)
            )
          );

          return newOrder;
        } catch (error) {
          ErrorHelper.throwServerError(error);
        }
      }

      static async findOrders(search = null, limit = 10, skip = 0) {
        try {
          let orders;
          if (search) {
            const pipeline = [
              {
                $lookup: {
                  from: "users",
                  let: { buyerRef: "$buyer.ref" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$buyerRef"] } } },
                    { $project: { firstName: 1 } }
                  ],
                  as: "buyerInfo"
                }
              },
              { $unwind: "$buyerInfo" },
              {
                $set: {
                  buyer: {
                    type: "$buyer.type",
                    // Prepravlja se buyer.ref u objekat koji sadrži originalni _id i firstName
                    ref: {
                      _id: "$buyer.ref",
                      firstName: "$buyerInfo.firstName"
                    }
                  }
                }
              },
              { $project: { buyerInfo: 0 } },
              {
                $match: {
                  $or: [
                    { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: search, options: "i" } } },
                    { totalPrice: { $regex: search, $options: "i" } },
                    { date: { $regex: search, $options: "i" } },
                    { "buyer.ref.firstName": { $regex: search, $options: "i" } },
                    { status: { $regex: search, $options: "i" } }
                  ]
                }
              },
              { $sort: { date: -1 } },
              { $skip: skip },
              { $limit: limit }
            ];
            
            
            orders = await OrderModel.aggregate(pipeline);

            console.log(orders);
          } else {
            orders = await OrderModel.find()
              .select("status totalPrice date buyer")
              .populate('buyer.ref', "firstName")
              .sort({ date: -1 })
              .limit(limit)
              .skip(skip)
              .lean();
          }
    
          return this.mapOrders(orders);
        } catch (error) {
          ErrorHelper.throwServerError(error);
        }
      }

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
    };

    static async findUserOrderDetails(orderId, userId) {
        try {
            const order = await OrderModel.findById(orderId)

            if (!order) {
                ErrorHelper.throwNotFoundError('Porudžbina');
            }

            if (order.buyer.ref._id.toString() !== userId.toString()) {
                ErrorHelper.throwConflictError("Nemate pravo pristupa!");
            }

            return this.mapOrderDetails(order);
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static mapOrders(orders) {
      return orders.map((order) => ({
        ID: { value: order._id },
        Kupac: { value: order.buyer.ref.firstName },
        Datum: { value: order.date.toLocaleDateString('sr-RS', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
          })},
        "Ukupna Cena" : { value: `${order.totalPrice} RSD`},
        Status: { value: order.status }
      }))
    }
    
    static mapOrderDetails(order) {
        return {
            ID: { value: order._id },
            Kupac: {
                Tip: { value: order.buyer.type },
                Ime: { value: order.buyer.firstName },
                Prezime: { value: CryptoService.decryptData(order.buyer.lastName) },
                ID: { value: order.buyer.ref._id },
            },
            Datum: { value: order.date.toLocaleDateString('sr-RS', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })},
            Poštarina: { value: order.shipping },
            Kupon: {
                Kod: { value: order.coupon.code },
                Popust: { value: `${order.coupon.discount} %` },
            },
            "Ukupna Cena" : { value: `${order.totalPrice} RSD`},
            Artikli: order.items.map(item => ({
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
                "Poštanski Broj": { value: order.address.postalCode }
            },
            Status: { value: order.status }
        }
    }
}

export default OredrService;