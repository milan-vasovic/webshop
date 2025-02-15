import ErrorHelper from "../helper/errorHelper.js";
import UserModel from "../model/user.js";
import CryptoService from "./cryptoService.js";
import EmailService from "./emailService.js";

class UserService {
   static async checkUserInfo(email, password) {
        const userExist = await UserModel.findOne({email: email}).select("_id password");

        if (!userExist){
            return false;
        }

        return userExist;
   }

   static async findUsers(userId, limit=10,skip=null) {
        try {
            const users = await UserModel.find({ _id: { $ne: userId } })
                .select("email firstName status role partner")
                .limit(limit)
                .skip(skip)
                .lean();

            if (!users) {
                ErrorHelper.throwNotFoundError("Korisnici");   
            }

            return this.mapUsers(users);

        } catch (error) {
            ErrorHelper.throwServerError("error")
        }
   }

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

   static async findUserForSession(userId) {
        const user = await UserModel.findById(userId).select("firstName cart role status");

        if (!user) {
            return false;
        }

        return user;
    }

    static async createNewUser(email, password, firstname, lastname) {
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

    static async addAddressToUser(city, street, number, postalCode, userId) {
        try {
            // Pronalaženje korisnika
            const user = await UserModel.findById(userId).select("addresses");
    
            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }
    
            // Provera da li adresa već postoji
            const alreadyExist = user.addresses.some(addr => 
                addr.city === city && 
                addr.postalCode === postalCode && 
                CryptoService.decryptData(addr.street).toString() === street.toString() &&
                CryptoService.decryptData(addr.number).toString() === number.toString()
            );
    
            if (alreadyExist) {
                ErrorHelper.throwConflictError("Ova adresa već postoji u sistemu.");
            }
    
            // Enkripcija ulice i broja
            const encryptedStreet = CryptoService.encryptData(street);
            const encryptedNumber = CryptoService.encryptData(number);
    
            // Dodavanje nove adrese u listu korisnika
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

    static async findUserCart(userId) {
        try {
            const user = await UserModel.findById(userId).select('cart').populate('cart.itemId',"title featureImage");

            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }

            const result = user.cart.map((item) => ({
                ID : { value: item.itemId },
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

    static async removeItemFromCart(userId, cartItemId) {
        try {
            const user = await UserModel.findById(userId).select('cart');

            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }

            const index = user.cart.findIndex(item => item._id.toString() === cartItemId.toString());

            if (index === -1) {
                ErrorHelper.throwNotFoundError("Element u Korpi");
            }
    
            user.cart.splice(index, 1);
            return user.save();
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async updateUserAfterOrder(userId, order, session, newTelephone = null, newAddress = null) {
        try {
            const user = await UserModel.findById(userId)
                .select('firstName cart orders email telephoneNumbers addresses');

            if (!user) {
                ErrorHelper.throwNotFoundError("Korisnik");
            }

            if (newTelephone) {
                console.log(newTelephone)
                user.telephoneNumbers.push({number: CryptoService.encryptData(newTelephone)});
            }

            if (newAddress) {
                console.log(newAddress)
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
