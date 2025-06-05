import mongoose from "mongoose";

import UserModel from "../model/user.js";

import CryptoService from "./cryptoService.js";
import EmailService from "./emailService.js";

import ErrorHelper from "../helper/errorHelper.js";
import CustomerService from "./customerService.js";
import OrderService from "./orderService.js";

class UserService {
  /**
   * Checks the user's information for validity.
   */
  static async validateUserInfo(email, password) {
    const userExist = await UserModel.findOne({ email: email }).select(
      "_id password confirmed"
    );

    if (!userExist) {
      return { success: false, message: "Nalog nije pronađen!" };
    }

    const checkPassword = await CryptoService.compareUserPasswords(
      password,
      userExist.password
    );

    if (!checkPassword) {
      return { success: false, message: "Neispravni podaci!", show: false };
    }

    if (!userExist.confirmed) {
      return {
        success: false,
        message: "Vaš nalog nije aktiviran!",
        show: true,
      };
    }

    return {
      success: true,
      _id: userExist._id,
    };
  }

  /**
   * Validates a user and sends a password reset token.
   */
  static async validateUserAndSendResetToken(email) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const user = await UserModel.findOne({ email })
        .select("firstName email resetToken resetTokenExpiration")
        .session(session);

      if (!user) {
        await session.commitTransaction();
        return { status: false, msg: "Neam Korisnika sa tom email adresuom!" };
      }

      if (user.resetToken && user.resetTokenExpiration > Date.now()) {
        const isSent = await EmailService.sendResetTokenToUser(user);

        if (!isSent) {
          await session.abortTransaction();
          ErrorHelper.throwEmailError();
        }

        await session.commitTransaction();
        return { status: true, msg: "Token već postoji, email ponovo poslat." };
      }

      const token = await CryptoService.createToken();

      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;

      await user.save({ session });

      const isSent = await EmailService.sendResetTokenToUser(user);
      if (!isSent) {
        await session.abortTransaction();
        ErrorHelper.throwEmailError();
      }

      await session.commitTransaction();
      return { status: true };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      ErrorHelper.throwServerError(error);
    } finally {
      session.endSession();
    }
  }

  /**
   * Validates a password reset token.
   */
  static async validateResetToken(token) {
    try {
      const user = await UserModel.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
      }).select("_id");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      return user;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async validateUserAndSendConfirmationAcount(email) {
    try {
      const user = await UserModel.findOne({ email: email }).select(
        "confirmToken confirmTokenExpiration"
      );

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      const confirmToken = await CryptoService.createToken();
      const confirmTokenExpiration = Date.now() + 2 * 24 * 60 * 60 * 1000;

      user.confirmToken = confirmToken;
      user.confirmTokenExpiration = confirmTokenExpiration;

      const emailSent = await EmailService.sendConfirmAccount(
        email,
        confirmToken
      );
      if (!emailSent) {
        return {
          success: false,
          message: "Neuspešno slanje emaila, zahtev za aktivaciju otkazan.",
        };
      }

      await user.save();

      return { success: true, message: "Uspešno ste zatražili aktivaciju!" };
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async confirmAccount(token) {
    try {
      if (!token) {
        ErrorHelper.throwNotFoundError("Nedostaje token za potvrdu naloga.");
      }

      // Pronađi korisnika sa ovim tokenom
      const user = await UserModel.findOne({ confirmToken: token }).select(
        "status confirmToken confirmTokenExpiration confirmed"
      );

      if (!user) {
        ErrorHelper.throwNotFoundError(
          "Nevažeći token ili korisnik ne postoji."
        );
      }

      // Proveri da li je token istekao
      if (Date.now() > user.confirmTokenExpiration) {
        ErrorHelper.throwConflictError(
          "Token za potvrdu je istekao. Zahtevajte novi email za potvrdu."
        );
      }

      // Ažuriraj status korisnika na 'active' i ukloni token
      user.status = ["active"];
      user.confirmToken = undefined;
      user.confirmTokenExpiration = undefined;
      user.confirmed = true;

      await user.save();

      return { success: true, message: "Vaš nalog je uspešno potvrđen!" };
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async updateUserPassword(userId, newPassword, passwordToken) {
    try {
      const user = await UserModel.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId,
      }).select("email password resetToken resetTokenExpiration");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      const securePassword = await CryptoService.hashPassword(newPassword);
      user.password = securePassword;
      user.resetToken = undefined;
      user.resetTokenExpiration = undefined;

      await user.save();

      return user.email;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Finds users based on a search query.
   */
  static async findUsers(userId, limit = 10, page = 1) {
    try {
      const skip = (page - 1) * limit;
      let filter = { _id: { $ne: userId } };

      const users = await UserModel.find(filter)
        .sort({ _id: -1 })
        .select("email firstName status role partner.isPartner")
        .skip(skip)
        .limit(limit)
        .lean();

      const totalCount = await UserModel.find(filter).countDocuments();

      return {
        users: this.mapUsers(users),
        totalCount: totalCount,
      };
    } catch (error) {
      ErrorHelper.throwServerError("Greška pri pretrazi korisnika");
    }
  }

  static async findUsersBySearch(userId, search, limit = 10, page = 1) {
    try {
      const skip = (page - 1) * limit;
      let filter = {};

      if (search) {
        const searchConditions = [
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$_id" },
                regex: search,
                options: "i",
              },
            },
          },
          { email: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { role: { $regex: search, $options: "i" } },
        ];

        if (searchConditions.length > 0) {
          filter = {
            $and: [{ _id: { $ne: userId } }, { $or: searchConditions }],
          };
        }
      }

      const users = await UserModel.find(filter)
        .sort({ _id: -1 })
        .select("email firstName status role partner.isPartner")
        .skip(skip)
        .limit(limit)
        .lean();

      if (!users) {
        ErrorHelper.throwNotFoundError("Korisnici");
      }

      const totalCount = await UserModel.find(filter).countDocuments();

      return {
        users: this.mapUsers(users),
        totalCount: totalCount,
      };
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Finds a user by their ID.
   */
  static async findUserById(userId) {
    const user = await UserModel.findById(userId)
      .select("-password -__v")
      .populate({
        path: "orders",
        select: "date totalPrice status",
        options: { sort: { date: -1 } },
      });

    if (!user) {
      return false;
    }

    return this.mapUserDetails(user);
  }

  /**
   * Finds a user for session management.
   */
  static async findUserForSession(userId) {
    const user = await UserModel.findById(userId).select(
      "firstName cart role status confirmed"
    );

    if (!user) {
      return false;
    }

    return user;
  }

  /**
   * Register a new user.
   */
  static async registerNewUser(
    email,
    password,
    firstname,
    lastname,
    telephone = null,
    address = null,
    session = null,
    isEncrypted = false
  ) {
    const userExist = await UserModel.findOne({ email }).select("email");
    if (userExist) {
      return { status: false, message: "Korisnik već postoji!" };
    }
  
    const customerExist = await CustomerService.validateCustomerByEmail(email, session);
  
    const confirmToken = await CryptoService.createToken();
    const confirmTokenExpiration = Date.now() + 2 * 24 * 60 * 60 * 1000;
  
    const securePassword = await CryptoService.hashPassword(password);
    const secureLastName = isEncrypted ? lastname : CryptoService.encryptData(lastname);
  
    const buildAddressObject = (addr) => {
      return {
        city: addr.Adresa ? addr.Adresa.Grad : addr.city,
        street: isEncrypted
          ? (addr.Adresa ? addr.Adresa.Ulica : addr.street)
          : CryptoService.encryptData(addr.Adresa ? addr.Adresa.Ulica : addr.street),
        number: isEncrypted
          ? (addr.Adresa ? addr.Adresa.Broj : addr.number)
          : CryptoService.encryptData(addr.Adresa ? addr.Adresa.Broj : addr.number),
        postalCode: addr.Adresa ? addr.Adresa["Poštanski Broj"] : addr.postalCode,
      };
    };
  
    if (customerExist) {  
      if (telephone) {
        customerExist.telephoneNumber.push({
          number: isEncrypted ? telephone : CryptoService.encryptData(telephone),
        });
      }
  
      if (address) {
        customerExist.address.push(buildAddressObject(address));
      }
  
      const newUser = new UserModel({
        email,
        password: securePassword,
        firstName: firstname,
        lastName: secureLastName,
        role: "user",
        status: ["pending"],
        telephoneNumbers: customerExist.telephoneNumber,
        addresses: customerExist.address,
        orders: customerExist.orders,
        cart: [],
        partner: {
          history: [],
          offers: [],
        },
        confirmToken,
        confirmTokenExpiration,
      });
  
      const emailSent = await EmailService.sendConfirmAccount(email, confirmToken);
      if (!emailSent) {
        ErrorHelper.throwEmailError();
      }
  
      await newUser.save({ session });
  
      if (newUser.orders && newUser.orders.length > 0) {
        await Promise.all(
          newUser.orders.map((orderId) =>
            OrderService.updateOrderBuyerRef(orderId, newUser._id, session)
          )
        );
      }
  
      await CustomerService.deleteCustomerById(customerExist._id, session);
      return newUser;
    }
  
    const secureTelephone = telephone
      ? [{
          number: isEncrypted ? telephone : CryptoService.encryptData(telephone),
        }]
      : [];
  
    const secureAddress = address ? [buildAddressObject(address)] : [];
  
    const newUser = new UserModel({
      email,
      password: securePassword,
      firstName: firstname,
      lastName: secureLastName,
      role: "user",
      status: ["pending"],
      telephoneNumbers: secureTelephone,
      addresses: secureAddress,
      orders: [],
      cart: [],
      partner: {
        history: [],
        offers: [],
      },
      confirmToken,
      confirmTokenExpiration,
    });
  
    const emailSent = await EmailService.sendConfirmAccount(email, confirmToken);
    if (!emailSent) {
      ErrorHelper.throwEmailError();
    }
  
    await newUser.save({ session });
    return newUser;
  }
  

  /**
   * Adds a phone number to a user.
   */
  static async addPhoneNumberToUser(phoneNumber, userId) {
    try {
      const user = await UserModel.findById(userId).select("telephoneNumbers");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      const alreadyExist = user.telephoneNumbers.some(
        (num) =>
          CryptoService.decryptData(num.number).toString() ===
          phoneNumber.toString()
      );

      if (alreadyExist) {
        ErrorHelper.throwConflictError("Broj telefona već postoji u sistemu.");
      }

      const securePhoneNumber = CryptoService.encryptData(phoneNumber);
      user.telephoneNumbers.push({ number: securePhoneNumber });
      await user.save();

      return true;
    } catch (error) {
      ErrorHelper.throwServerError(
        `Greška pri dodavanju broja: ${error.message}`
      );
    }
  }

  /**
   * Adds an address to a user.
   *
   * @param {string} userId - The ID of the user to add the address to.
   * @param {Object} address - The address to add.
   * @param {string} address.city - The city of the address.
   * @param {string} address.street - The street of the address.
   * @param {string} address.number - The number of the address.
   * @param {string} address.postalCode - The postal code of the address.
   * @returns {Promise<Object>} - A promise that resolves to the updated user.
   */
  static async addAddressToUser(city, street, number, postalCode, userId) {
    try {
      // Pronalaženje korisnika
      const user = await UserModel.findById(userId).select("addresses");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      const alreadyExist = user.addresses.some(
        (addr) =>
          addr.city === city &&
          addr.postalCode === postalCode &&
          CryptoService.decryptData(addr.street).toString() ===
            street.toString() &&
          CryptoService.decryptData(addr.number).toString() ===
            number.toString()
      );

      if (alreadyExist) {
        ErrorHelper.throwConflictError("Ova adresa već postoji u sistemu.");
      }

      const encryptedStreet = CryptoService.encryptData(street);
      const encryptedNumber = CryptoService.encryptData(number);

      user.addresses.push({
        city: city,
        street: encryptedStreet,
        number: encryptedNumber,
        postalCode: postalCode,
      });

      await user.save();
      return true;
    } catch (error) {
      ErrorHelper.throwServerError(
        `Greška pri dodavanju adrese: ${error.message}`
      );
    }
  }

  /**
   * Finds the cart of a user.
   */
  static async findUserCart(userId) {
    try {
      const user = await UserModel.findById(userId)
        .select("cart")
        .populate("cart.itemId", "title featureImage");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      const result = user.cart.map((item) => ({
        ID: { value: item.itemId._id },
        Slika: {
          value: item.itemId.featureImage.img,
        },
        "Variacija ID": { value: item.variationId },
        Artikal: { value: item.itemId.title },
        Veličina: { value: item.size },
        Boja: { value: item.color },
        Količina: { value: item.amount },
        Cena: { value: item.price },
        Kod: { value: item.code || "Nema Koda" },
      }));

      return result;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Finds user information by their ID.
   */
  static async findUserInfoById(userId) {
    try {
      const user = await UserModel.findById(userId).select(
        "email firstName lastName telephoneNumbers addresses"
      );

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      const phones = user.telephoneNumbers.map((phone) => ({
        Broj: CryptoService.decryptData(phone.number),
      }));

      const addresses = user.addresses.map((address) => ({
        Adresa: {
          Grad: address.city,
          Ulica: CryptoService.decryptData(address.street),
          Broj: CryptoService.decryptData(address.number),
          "Poštanski Broj": address.postalCode,
        },
      }));

      const userInfo = {
        ID: user._id,
        Ime: user.firstName,
        Prezime: CryptoService.decryptData(user.lastName),
        Email: user.email,
        Telefoni: phones,
        Adrese: addresses,
      };

      return userInfo;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findUserEmailById(userId) {
    try {
      const user = UserModel.findById(userId).select("email firstName");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      return user;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findUserByEmail(email) {
    try {
      const user = UserModel.findOne({ email: email }).select(
        "_id email firstName"
      );

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      return user;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Deletes a phone number from a user.
   */
  static async deletePhoneNumberFromUser(numberId, userId) {
    try {
      const user = await UserModel.findById(userId).select("telephoneNumbers");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      const index = user.telephoneNumbers.findIndex(
        (num) => num._id.toString() === numberId.toString()
      );

      if (index === -1) {
        ErrorHelper.throwNotFoundError("Telefonski broj nije pronađen");
      }

      user.telephoneNumbers.splice(index, 1);

      await user.save();

      return true;
    } catch (error) {
      ErrorHelper.throwConflictError(
        `Greška pri brisanju telefonskog broja: ${error.message}`
      );
    }
  }

  /**
   * Deletes an address from a user.
   */
  static async deleteAddressFromUser(addressId, userId) {
    try {
      const user = await UserModel.findById(userId).select("addresses");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      const index = user.addresses.findIndex(
        (add) => add._id.toString() === addressId.toString()
      );

      if (index === -1) {
        ErrorHelper.throwNotFoundError("Adresa nije pronađena");
      }

      user.addresses.splice(index, 1);

      await user.save();

      return true;
    } catch (error) {
      ErrorHelper.throwConflictError(
        `Greška pri brisanju adrese: ${error.message}`
      );
    }
  }

  /**
   * Adds an item to a user's cart.
   */
  static async addItemToUserCart(userId, item) {
    try {
      const user = await UserModel.findById(userId).select("cart");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      user.cart.push(item);

      return user.save();
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Updates a user's cart with the session cart.
   */
  static async updateCartWithSessionCart(userId, sessionCart) {
    try {
      const user = await UserModel.findById(userId).select("cart");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      sessionCart.forEach((c) => {
        user.cart.push(c);
      });

      return user.save();
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Removes an item from a user's cart.
   */
  static async removeItemFromCart(userId, cartItemId) {
    try {
      const user = await UserModel.findById(userId).select("cart");
      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      const index = user.cart.findIndex(
        (item) => item.itemId.toString() === cartItemId.toString()
      );

      if (index === -1) {
        ErrorHelper.throwNotFoundError("Element u Korpi");
      }

      user.cart.splice(index, 1);
      return user.save();
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async removeItemsFromCart(userId) {
    try {
      const user = await UserModel.findById(userId).select("cart");

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      user.cart = [];
      return await user.save();
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Uklanja artikal iz svih korisničkih korpi.
   */
  static async removeItemFromCarts(itemId, session) {
    await UserModel.updateMany(
      { "cart.itemId": itemId },
      { $pull: { cart: { itemId: itemId } } },
      { session }
    );
  }

  /**
   * Uklanja artikal iz svih ponuda partnera.
   */
  static async removeItemFromPartnerOffers(itemId, session) {
    await UserModel.updateMany(
      { "partner.offers.itemId": itemId },
      { $pull: { "partner.offers": { itemId: itemId } } },
      { session }
    );
  }

  /**
   * Updates a user's information after an order is placed.
   */
  static async updateUserAfterOrder(
    userId,
    order,
    session,
    newTelephone = null,
    newAddress = null
  ) {
    try {
      const user = await UserModel.findById(userId)
        .select("firstName cart orders email telephoneNumbers addresses")
        .session(session);

      if (!user) {
        ErrorHelper.throwNotFoundError("Korisnik");
      }

      if (newTelephone) {
        const existsTel = user.telephoneNumbers.some(
          (t) => t.number === newTelephone
        );
        if (!existsTel) {
          user.telephoneNumbers.push({ number: newTelephone });
        }
      }

      if (newAddress) {
        const existsAddress = user.addresses.some(
          (a) =>
            a.city === newAddress.city &&
            a.street === newAddress.street &&
            a.number === newAddress.number &&
            a.postalCode === newAddress.postalCode
        );
        if (!existsAddress) {
          user.addresses.push({
            city: newAddress.city,
            street: newAddress.street,
            number: newAddress.number,
            postalCode: newAddress.postalCode,
          });
        }
      }

      user.cart = [];
      user.orders.push(order._id);

      EmailService.sendOrderInfo(user.firstName, user.email, order);

      return await user.save({ session });
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Maps user details to a specific format.
   */
  static mapUserDetails(user) {
    user.lastName = CryptoService.decryptData(user.lastName);
    if (
      Array.isArray(user.telephoneNumbers) &&
      user.telephoneNumbers.length > 0
    ) {
      user.telephoneNumbers = user.telephoneNumbers.map((number) => ({
        number: CryptoService.decryptData(number.number),
        _id: number._id,
      }));
    }

    if (Array.isArray(user.addresses) && user.addresses.length > 0) {
      user.addresses = user.addresses.map((address) => ({
        city: address.city,
        street: CryptoService.decryptData(address.street),
        number: CryptoService.decryptData(address.number),
        postalCode: address.postalCode ? address.postalCode : null,
        _id: address._id,
      }));
    }

    if (user.partner.isPartner) {
      user.partner = {
        Partner: { value: user.partner.isPartner },
        Istorija: { value: user.partner.history },
        Prodavnica: {
          Status: { value: user.partner.shop.status },
          Boja: { value: user.partner.shop.color },
          Font: { value: user.partner.shop.font },
          Logo: { value: user.partner.shop.logo },
        },
        Balans: { value: user.partner.wallet },
        Rank: {
          Poeni: { value: user.partner.rank.points },
          Popust: { value: user.partner.rank.discount },
          Nivo: { value: user.partner.rank.level },
          "Maksimalni Broj": { value: user.partner.rank.maxOffers },
        },
        Ponuda: { value: user.partner.offers },
      };
    } else {
      user.partner = undefined;
    }

    const mapedOrders = user.orders.map((order) => ({
      ID: { value: order._id },
      "Broj Porudžbine": order._id,
      Status: order.status,
      Cena: `${order.totalPrice} RSD`,
      Datum: order.date.toLocaleDateString("sr-RS", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    }));

    const Korisnik = {
      Email: { value: user.email },
      Ime: { value: user.firstName },
      Prezime: { value: user.lastName },
      "Brojevi Telefona": user.telephoneNumbers.map((numb) => ({
        ID: numb._id,
        Broj: numb.number,
      })),
      Adrese: user.addresses.map((add) => ({
        ID: add._id,
        Grad: add.city,
        Ulica: add.street,
        Broj: add.number,
        "Poštanski Broj": add.postalCode,
      })),
      Status: { value: user.status },
      Uloga: { value: user.role },
      Partner: user.partner,
      Porudžbine: mapedOrders,
    };

    return Korisnik;
  }

  static mapUsers(users) {
    return users.map((user) => ({
      ID: { value: user._id },
      Email: { value: user.email },
      Ime: { value: user.firstName },
      Status: { value: user.status },
      Uloga: { value: user.role },
      Partner: { value: user.partner.isPartner ? "Da" : "Ne" },
    }));
  }
}

export default UserService;
