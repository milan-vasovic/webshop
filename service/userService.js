
import mongoose from "mongoose";

import UserModel from "../model/user.js";

import CryptoService from "./cryptoService.js";
import EmailService from "./emailService.js";

import ErrorHelper from "../helper/errorHelper.js";

class UserService {
    /**
    * Checks the user's information for validity.
    * 
    * @param {Object} userInfo - The user information to check.
    * @param {string} userInfo.email - The user's email address.
    * @param {string} userInfo.password - The user's password.
    * @param {string} [userInfo.firstName] - The user's first name (optional).
    * @param {string} [userInfo.lastName] - The user's last name (optional).
    * @returns {Promise<Object>} - A promise that resolves to an object containing the validation results.
    */
    static async checkUserInfo(email) {
        const userExist = await UserModel.findOne({email: email}).select("_id password");

        if (!userExist){
            return false;
        }

        return userExist;
   }

    /**
    * Validates a user and sends a password reset token.
    * 
    * @param {string} email - The email of the user to validate.
    * @returns {Promise<void>}
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

            const token = await CryptoService.createResetToken();

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
    * 
    * @param {string} token - The password reset token to validate.
    * @returns {Promise<Object>} - A promise that resolves to the user associated with the token.
    */
   static async validateResetToken(token) {
        try {
            const user = await UserModel.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() }}).select("_id");
            
            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }

            return user;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
   };

   static async updateUserPassword(userId, newPassword, passwordToken) {
        try {
            const user = await UserModel.findOne({
                resetToken: passwordToken,
                resetTokenExpiration: { $gt: Date.now() },
                _id: userId,
            })
            .select("email password resetToken resetTokenExpiration");
            
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
    * 
    * @param {string} [search] - The search query to filter users by (optional).
    * @returns {Promise<Array>} - A promise that resolves to an array of users.
    */
   static async findUsers(userId, search, limit = 10, skip = null) {
        try {
            let filter = { _id: { $ne: userId } };

            if (search) {
                const searchConditions = [
                    { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: search, options: "i" } } },
                    { email: { $regex: search, $options: "i" } },
                    { firstName: { $regex: search, $options: "i" } },
                    { status: { $regex: search, $options: "i" } },
                    { role: { $regex: search, $options: "i" } },
                ];

                if (searchConditions.length > 0) {
                    filter = {
                        $and: [
                            { _id: { $ne: userId } },
                            { $or: searchConditions }
                        ]
                    };
                }
            }

            const users = await UserModel.find(filter)
                .select("email firstName status role partner.isPartner")
                .limit(limit)
                .skip(skip)
                .lean();

            return this.mapUsers(users);

        } catch (error) {
            ErrorHelper.throwServerError("Greška pri pretrazi korisnika");
        }
    }

    /**
    * Finds a user by their ID.
    * 
    * @param {string} userId - The ID of the user to find.
    * @returns {Promise<Object>} - A promise that resolves to the user details.
    */
   static async findUserById(userId){
        const user = await UserModel.findById(userId).select("-password -__v")
            .populate({
                path: "orders",
                select: "date totalPrice status",
                options: { sort: { date: -1 } }
              });

        if (!user) {
            return false;
        }

        return this.mapUserDetails(user);
   }

    /**
    * Finds a user for session management.
    * 
    * @param {string} userId - The ID of the user to find.
    * @returns {Promise<Object>} - A promise that resolves to the user details for session management.
    */
   static async findUserForSession(userId) {
        const user = await UserModel.findById(userId).select("firstName cart role status");

        if (!user) {
            return false;
        }

        return user;
    }

    /**
    * Register a new user.
    * 
    * @param {Object} userData - The data of the user to create.
    * @param {string} userData.email - The email of the user.
    * @param {string} userData.password - The password of the user.
    * @param {string} userData.firstName - The first name of the user.
    * @param {string} userData.lastName - The last name of the user.
    * @returns {Promise<Object>} - A promise that resolves to the created user.
    */
    static async registerNewUser(email, password, firstname, lastname) {
        const securePassword = await CryptoService.hashPassword(password);
        const secureLastName = await CryptoService.encryptData(lastname);

        const newUser = new UserModel({
            email: email,
            password: securePassword,
            firstName: firstname,
            lastName: secureLastName,
            role: 'user',
            status: ['active'],
            telephoneNumbers: [],
            addresses: [],
            orders: [],
            cart: [],
            partner: {
                history: [],
                offers: []
            }
        })

        return newUser.save();
    }

    /**
    * Adds a phone number to a user.
    * 
    * @param {string} userId - The ID of the user to add the phone number to.
    * @param {string} phoneNumber - The phone number to add.
    * @returns {Promise<Object>} - A promise that resolves to the updated user.
    */
    static async addPhoneNumberToUser(phoneNumber, userId) {
        try {
            const user = await UserModel.findById(userId).select("telephoneNumbers");
    
            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }
    
            const alreadyExist = user.telephoneNumbers.some(num =>
                CryptoService.decryptData(num.number).toString() === phoneNumber.toString()
            );
    
            if (alreadyExist) {
                ErrorHelper.throwConflictError("Broj telefona već postoji u sistemu.");
            }
    
            const securePhoneNumber = CryptoService.encryptData(phoneNumber);
            user.telephoneNumbers.push({ number: securePhoneNumber });
            await user.save();
            
            return true;
        } catch (error) {
            ErrorHelper.throwServerError(`Greška pri dodavanju broja: ${error.message}`);
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
    
            const alreadyExist = user.addresses.some(addr => 
                addr.city === city && 
                addr.postalCode === postalCode && 
                CryptoService.decryptData(addr.street).toString() === street.toString() &&
                CryptoService.decryptData(addr.number).toString() === number.toString()
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
                postalCode: postalCode
            });
    
            await user.save();
            return true;
        } catch (error) {
            ErrorHelper.throwServerError(`Greška pri dodavanju adrese: ${error.message}`);
        }
    }    

    /**
    * Finds the cart of a user.
    * 
    * @param {string} userId - The ID of the user to find the cart for.
    * @returns {Promise<Object>} - A promise that resolves to the user's cart.
    */
    static async findUserCart(userId) {
        try {
            const user = await UserModel.findById(userId).select('cart').populate('cart.itemId',"title featureImage");

            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }

            const result = user.cart.map((item) => ({
                ID : { value: item.itemId._id },
                Slika: {
                    value: item.itemId.featureImage.img
                },
                'Variacija ID' : {value: item.variationId },
                'Artikal': { value: item.itemId.title },
                Veličina: { value: item.size },
                Boja: { value: item.color },
                Količina: { value: item.amount },
                Cena: { value: item.price },
                Kod: { value: item.code || "Nema Koda"}
            }))

            return result;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    /**
    * Finds user information by their ID.
    * 
    * @param {string} userId - The ID of the user to find.
    * @returns {Promise<Object>} - A promise that resolves to the user information.
    */
    static async findUserInfoById(userId) {
        try {
            const user = await UserModel.findById(userId)
                .select("email firstName lastName telephoneNumbers addresses")

            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }

            const phones = user.telephoneNumbers.map((phone) => ({
                Broj: CryptoService.decryptData(phone.number)
            }))

            const addresses = user.addresses.map((address) => ({
                Adresa: {
                    Grad: address.city,
                    Ulica: CryptoService.decryptData(address.street),
                    Broj: CryptoService.decryptData(address.number),
                    "Poštanski Broj": address.postalCode
                }
            }))

            const userInfo = {
                ID: user._id,
                Ime: user.firstName,
                Prezime: CryptoService.decryptData(user.lastName),
                Email: user.email,
                Telefoni: phones,
                Adrese: addresses
            }

            return userInfo;

        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    /**
    * Deletes a phone number from a user.
    * 
    * @param {string} userId - The ID of the user to delete the phone number from.
    * @param {string} phoneNumber - The phone number to delete.
    * @returns {Promise<Object>} - A promise that resolves to the updated user.
    */
    static async deletePhoneNumberFromUser(numberId, userId) {
        try {
            const user = await UserModel.findById(userId).select("telephoneNumbers");
    
            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }
    
            const index = user.telephoneNumbers.findIndex(num => num._id.toString() === numberId.toString());
    
            if (index === -1) {
                ErrorHelper.throwNotFoundError("Telefonski broj nije pronađen");
            }

            user.telephoneNumbers.splice(index, 1);
    
            await user.save();
    
            return true;
        } catch (error) {
            ErrorHelper.throwConflictError(`Greška pri brisanju telefonskog broja: ${error.message}`);
        }
    }

    /**
    * Deletes an address from a user.
    * 
    * @param {string} userId - The ID of the user to delete the address from.
    * @param {Object} address - The address to delete.
    * @param {string} address.city - The city of the address.
    * @param {string} address.street - The street of the address.
    * @param {string} address.number - The number of the address.
    * @param {string} address.postalCode - The postal code of the address.
    * @returns {Promise<Object>} - A promise that resolves to the updated user.
    */
    static async deleteAddressFromUser(addressId, userId) {
        try {
            const user = await UserModel.findById(userId).select("addresses");
            
            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }
    
            const index = user.addresses.findIndex(add => add._id.toString() === addressId.toString());
    
            if (index === -1) {
                ErrorHelper.throwNotFoundError("Adresa nije pronađena");
            }

            user.addresses.splice(index, 1);
    
            await user.save();
    
            return true;
        } catch (error) {
            ErrorHelper.throwConflictError(`Greška pri brisanju adrese: ${error.message}`);
        }
    }
    
    /**
    * Adds an item to a user's cart.
    * 
    * @param {string} userId - The ID of the user to add the item to.
    * @param {Object} item - The item to add to the cart.
    * @param {string} item.itemId - The ID of the item.
    * @param {string} item.variationId - The ID of the variation of the item.
    * @param {number} item.quantity - The quantity of the item.
    * @returns {Promise<Object>} - A promise that resolves to the updated user cart.
    */
    static async addItemToUserCart(userId, item) {
        try {
            const user = await UserModel.findById(userId).select('cart');

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
    * 
    * @param {string} userId - The ID of the user to update the cart for.
    * @param {Array<Object>} sessionCart - The session cart to update the user's cart with.
    * @returns {Promise<Object>} - A promise that resolves to the updated user cart.
    */
    static async updateCartWithSessionCart(userId, sessionCart) {
        try {
            const user = await UserModel.findById(userId)
                .select('cart');

            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }
            
            sessionCart.forEach(c => {
                user.cart.push(c)
            })

            return user.save();
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    /**
    * Removes an item from a user's cart.
    * 
    * @param {string} userId - The ID of the user to remove the item from.
    * @param {string} itemId - The ID of the item to remove.
    * @param {string} [variationId] - The ID of the variation of the item to remove (optional).
    * @returns {Promise<Object>} - A promise that resolves to the updated user cart.
    */
    static async removeItemFromCart(userId, cartItemId) {
        try {
            const user = await UserModel.findById(userId).select('cart');
            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }

            const index = user.cart.findIndex(item => item.itemId.toString() === cartItemId.toString());

            if (index === -1) {
                ErrorHelper.throwNotFoundError("Element u Korpi");
            }
    
            user.cart.splice(index, 1);
            return user.save();
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    /**
    * Uklanja artikal iz svih korisničkih korpi.
    * @param {string} itemId - ID artikla koji se uklanja
    * @param {Object} session - Mongoose transakcija
    * @returns {Promise<void>}
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
     * @param {string} itemId - ID artikla koji se uklanja
     * @param {Object} session - Mongoose transakcija
     * @returns {Promise<void>}
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
    * 
    * @param {string} userId - The ID of the user to update.
    * @param {Object} orderData - The data of the order placed.
    * @param {Object} session - The mongoose session object.
    * @returns {Promise<Object>} - A promise that resolves to the updated user.
    */
    static async updateUserAfterOrder(userId, order, session, newTelephone = null, newAddress = null) {
        try {
            const user = await UserModel.findById(userId)
                .select('firstName cart orders email telephoneNumbers addresses');

            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }

            if (newTelephone) {
                user.telephoneNumbers.push({number: CryptoService.encryptData(newTelephone)});
            }

            if (newAddress) {
                user.addresses.push({
                    city: newAddress.Adresa.Grad,
                    street: CryptoService.encryptData(newAddress.Adresa.Ulica),
                    number: CryptoService.encryptData(newAddress.Adresa.Broj),
                    postalCode: newAddress.Adresa["Poštanski Broj"]
                });
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
    * 
    * @param {Object} user - The user object to map.
    * @returns {Object} - The mapped user details.
    */
    static mapUserDetails(user) {
        user.lastName = CryptoService.decryptData(user.lastName);
        if (Array.isArray(user.telephoneNumbers) && user.telephoneNumbers.length > 0) {
            user.telephoneNumbers = user.telephoneNumbers.map(number => ({
                number: CryptoService.decryptData(number.number),
                _id: number._id
            }));
        }
    
        if (Array.isArray(user.addresses) && user.addresses.length > 0) {
            user.addresses = user.addresses.map(address => ({
                city: address.city,
                street: CryptoService.decryptData(address.street),
                number: CryptoService.decryptData(address.number),
                postalCode: address.postalCode ?address.postalCode : null,
                _id: address._id
            }));
        }

        if(user.partner.isPartner) {
            user.partner = {
                Partner : { value: user.partner.isPartner },
                Istorija: {value: user.partner.history },
                Prodavnica: {
                    Status: { value: user.partner.shop.status },
                    Boja: { value: user.partner.shop.color },
                    Font: { value: user.partner.shop.font },
                    Logo: { value: user.partner.shop.logo }
                },
                Balans: { value: user.partner.wallet },
                Rank: {
                    Poeni: {value: user.partner.rank.points },
                    Popust: { value: user.partner.rank.discount },
                    Nivo: { value: user.partner.rank.level },
                    'Maksimalni Broj': { value: user.partner.rank.maxOffers }
                },
                Ponuda: { value: user.partner.offers },
            }
        } else {
            user.partner = undefined;
        }

        const mapedOrders = user.orders.map((order) => ({
                ID: { value: order._id },
                "Broj Porudžbine": order._id,
                Status: order.status,
                Cena: `${order.totalPrice} RSD`,
                Datum: order.date.toLocaleDateString('sr-RS', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
        }))

        const Korisnik = {
            Email: { value: user.email },
            Ime: { value: user.firstName },
            Prezime: { value: user.lastName },
            'Brojevi Telefona' : user.telephoneNumbers.map(numb => ({
                ID: numb._id,
                Broj: numb.number
            })),
            Adrese: user.addresses.map(add => ({
                ID: add._id,
                Grad: add.city,
                Ulica: add.street,
                Broj: add.number,
                "Poštanski Broj": add.postalCode
            })),
            Status: { value: user.status },
            Uloga: { value: user.role },
            Partner: user.partner,
            'Porudžbine': mapedOrders
        }

        return Korisnik;
    }

    static mapUsers(users) {
        return users.map((user) => ({
            ID: { value: user._id },
            Email: { value: user.email },
            Ime: { value: user.firstName },
            Status: { value: user.status },
            Uloga: { value: user.role },
            Partner: { value: user.partner.isPartner ? "Da" : "Ne"}
        }))
    }
}

export default UserService;
