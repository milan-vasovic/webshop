import CustomerModel from "../model/customer.js";

import CryptoService from "./cryptoService.js";

import ErrorHelper from "../helper/errorHelper.js";

class CustomerService {
  /**
   * Finds customers based on a search query.
   *
   * @param {string} [search] - The search query to filter customers by (optional).
   * @returns {Promise<Array>} - A promise that resolves to an array of customers.
   */
  static async findCustomers(search = null, limit = 10, skip = 0) {
    try {
      let filter;
      if (search) {
        filter = {
          $or: [
            {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$_id" },
                  regex: search,
                  options: "i",
                },
              },
            },
            { firstName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        };
      }

      const customers = await CustomerModel.find(filter)
        .select("firstName email address.city")
        .skip(skip)
        .limit(limit)
        .lean();

      if (!customers) {
        ErrorHelper.throwNotFoundError("Kupci");
      }

      return this.mapCustomers(customers);
    } catch (error) {
      ErrorHelper.throwServerError("Kupci");
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

  static async validateCustomerByEmail(email, session) {
    try {
      const customer = await CustomerModel.findOne({email: email})
        .select("telephoneNumber address orders")

      if (!customer) {
        ErrorHelper.throwNotFoundError("Kupac")
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
      const encryptedLastName = CryptoService.encryptData(lastName);
      const encryptedTelephone = CryptoService.encryptData(telephone);
      const encryptedStreet = CryptoService.encryptData(address.street);
      const encryptedNumber = CryptoService.encryptData(address.number);

      const newAddress = {
        city: address.city,
        street: encryptedStreet,
        number: encryptedNumber,
        postalCode: address.postalCode,
      };

      let existingCustomer = await CustomerModel.findOne({
        email: email,
      }).session(session);

      if (!existingCustomer) {
        const newCustomer = new CustomerModel({
          firstName: firstName,
          lastName: encryptedLastName,
          email: email,
          telephoneNumber: [{ number: encryptedTelephone }],
          address: [newAddress],
        });

        return await newCustomer.save({ session });
      } else {
        let isUpdated = false;

        const phoneExists = existingCustomer.telephoneNumber.some(
          (phone) => phone.number === encryptedTelephone
        );

        if (!phoneExists) {
          existingCustomer.telephoneNumber.push({ number: encryptedTelephone });
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
      const customer = await CustomerModel.deleteOne({ _id : customerId}).session(session);
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
