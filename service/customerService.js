import CustomerModel from "../model/customer.js";

import CryptoService from "./cryptoService.js";

import ErrorHelper from "../helper/errorHelper.js";

import mongoose from "mongoose";
import UserService from "./userService.js";

class CustomerService {
  /**
   * Finds customers based on a search query.
   *
   * @param {string} [search] - The search query to filter customers by (optional).
   * @returns {Promise<Array>} - A promise that resolves to an array of customers.
   */
  static async findCustomers(limit = 10, page = 1) {
    try {
      const skip = (page - 1) * limit;

      const customers = await CustomerModel.find()
        .sort({ "address.city": 1, _id: -1 })
        .select("firstName email address.city")
        .skip(skip)
        .limit(limit)
        .lean();

      if (!customers) {
        ErrorHelper.throwNotFoundError("Kupci");
      }

      const totalCount = await CustomerModel.find().countDocuments();

      return {
        customers: this.mapCustomers(customers),
        totalCount: totalCount,
      };
    } catch (error) {
      ErrorHelper.throwServerError("Kupci");
    }
  }

  static async findCustomersBySearch(
    search,
    limit = 10,
    page = 1,
  ) {
    try {
      const skip = (page - 1) * limit;
      const filter = {};

      if (search) {
        const trimedSearch = search.trim().toLowerCase();
        const searchRegex = new RegExp(trimedSearch, "i");

        filter.$or = [
          { email: { $regex: searchRegex } },
          { firstName: { $regex: searchRegex } },
          { "address.city": { $regex: searchRegex } },
        ];

        // Pretraga po _id ako korisnik unese validan ObjectId
        if (mongoose.Types.ObjectId.isValid(trimedSearch)) {
          filter.$or.push({ _id: new mongoose.Types.ObjectId(trimedSearch) });
        }
      }

      const [customers, totalCount] = await Promise.all([
        CustomerModel.find(filter)
          .sort({ "address.city": 1, _id: -1 })
          .select("firstName email  address.city")
          .skip(skip)
          .limit(limit)
          .lean(),
        CustomerModel.find(filter).countDocuments(),
      ]);

      if (!customers || customers.length === 0) {
        ErrorHelper.throwNotFoundError("Kupci");
      }

      return {
        customers: this.mapCustomers(customers),
        totalCount,
      };
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Finds a customer by their ID.
   *
   * @param {string} customerId - The ID of the customer to find.
   * @returns {Promise<Object>} - A promise that resolves to the customer details.
   */
  static async findCustomerById(customerId) {
    try {
      const customer = await CustomerModel.findById(customerId).populate({
        path: "orders",
        select: "date totalPrice status",
        options: { sort: { date: -1 } },
      });

      if (!customer) {
        ErrorHelper.throwNotFoundError("Kupac");
      }

      return this.mapCustomerDetails(customer);
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findCustomerEmailById(customerId) {
    try {
      const customer = CustomerModel.findById(customerId).select("email");

      if (!customer) {
        ErrorHelper.throwNotFoundError("Kupac");
      }

      return customer;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findCustomerByEmail(email) {
    try {
      const customer = await CustomerModel.findOne({ email: email }).populate({
        path: "orders",
        select: "date totalPrice status",
        options: { sort: { date: -1 } },
      });

      if (!customer) {
        const user = await UserService.findUserByEmail(email);
        if (user) {
          return user;
        } else {
          ErrorHelper.throwNotFoundError("Kupac");
        }
      }

      return customer;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async validateCustomerByEmail(email, session) {
    try {
      const customer = await CustomerModel.findOne({ email: email }).select(
        "telephoneNumber address orders"
      );

      if (!customer) {
        return false;
      }

      return customer;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }
  /**
   * Creates a new customer.
   *
   * @param {Object} customerData - The data of the customer to create.
   * @param {string} customerData.firstName - The first name of the customer.
   * @param {string} customerData.lastName - The last name of the customer.
   * @param {string} customerData.email - The email of the customer.
   * @param {string} customerData.password - The password of the customer.
   * @param {Array<Object>} [customerData.address] - The addresses of the customer (optional).
   * @returns {Promise<Object>} - A promise that resolves to the created customer.
   */
  static async registerNewCustomer(
    firstName,
    lastName,
    email,
    telephone,
    address,
    session
  ) {
    try {
      const newAddress = {
        city: address.city,
        street: address.street,
        number: address.number,
        postalCode: address.postalCode,
      };

      let existingCustomer = await CustomerModel.findOne({
        email: email,
      }).session(session);

      if (!existingCustomer) {
        const newCustomer = new CustomerModel({
          firstName: firstName,
          lastName: lastName,
          email: email,
          telephoneNumber: [{ number: telephone }],
          address: [newAddress],
        });

        return await newCustomer.save({ session });
      } else {
        let isUpdated = false;

        const phoneExists = existingCustomer.telephoneNumber.some(
          (phone) => phone.number === telephone
        );

        if (!phoneExists) {
          existingCustomer.telephoneNumber.push({ number: telephone });
          isUpdated = true;
        }

        const addressExists = existingCustomer.address.some(
          (addr) =>
            addr.city === newAddress.city &&
            addr.street === newAddress.street &&
            addr.number === newAddress.number &&
            addr.postalCode === newAddress.postalCode
        );

        if (!addressExists) {
          existingCustomer.address.push(newAddress);
          isUpdated = true;
        }

        if (isUpdated) {
          await existingCustomer.save({ session });
        }

        return existingCustomer;
      }
    } catch (error) {
      return { status: false, msg: error.message };
    }
  }

  /**
   * Updates the orders of a customer.
   *
   * @param {string} customerId - The ID of the customer to update.
   * @param {string} orderId - The ID of the order to add to the customer's orders.
   * @param {Object} session - The mongoose session object.
   * @returns {Promise<Object>} - A promise that resolves to the updated customer or an error message.
   */
  static async updateCustomerOrders(customerId, orderId, session) {
    try {
      const customer = await CustomerModel.findById(customerId)
        .select("orders")
        .session(session);

      if (!customer) {
        return { status: false, msg: "Kupac nije pronađen!" };
      }

      customer.orders.push(orderId);

      return await customer.save({ session });
    } catch (error) {
      return { status: false, msg: error };
    }
  }

  static async deleteCustomerById(customerId, session) {
    try {
      const customer = await CustomerModel.deleteOne({
        _id: customerId,
      }).session(session);
      return customer;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Maps customers to a specific format.
   *
   * @param {Array} customers - The array of customers to map.
   * @returns {Array} - An array of mapped customers.
   */
  static mapCustomers(customers) {
    return customers.map((customer) => ({
      ID: { value: customer._id },
      Ime: { value: customer.firstName },
      Email: { value: customer.email },
      Gradovi: {
        value: [...new Set(customer.address.map((addr) => addr.city))].join(
          ", "
        ),
      },
    }));
  }

  /**
   * Maps customer details to a specific format.
   *
   * @param {Object} customer - The customer object to map.
   * @returns {Object} - The mapped customer details.
   */
  static mapCustomerDetails(customer) {
    return {
      ID: { value: customer._id },
      Ime: { value: customer.firstName },
      Prezime: { value: CryptoService.decryptData(customer.lastName) },
      Email: { value: customer.email },
      "Brojevi Telefona": customer.telephoneNumber.map((numb) => ({
        Broj: { value: CryptoService.decryptData(numb.number) },
      })),
      Adrese: customer.address.map((add) => ({
        Grad: { value: add.city },
        Ulica: { value: CryptoService.decryptData(add.street) },
        Broj: { value: CryptoService.decryptData(add.number) },
        "Poštanski Broj": { value: add.postalCode },
      })),
      Porudžbine: customer.orders.map((order) => ({
        ID: { value: order._id },
        "Broj Porudžbine": order._id,
        Status: order.status,
        Cena: `${order.totalPrice} RSD`,
        Datum: order.date.toLocaleDateString("sr-RS", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      })),
    };
  }
}

export default CustomerService;
