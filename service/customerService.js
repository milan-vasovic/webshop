import CustomerModel from "../model/customer.js";
import ErrorHelper from "../helper/errorHelper.js";
import CryptoService from "./cryptoService.js";

class CustomerService {
    static async findCustomers(search = null, limit = 10, skip = 0) {
        try {
            let filter;
            if (search) {
                filter = {
                    $or: [
                        { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: search, options: "i" } } },
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

            console.log(customers);

            if (!customers) {
                ErrorHelper.throwNotFoundError("Kupci");
            }

            return this.mapCustomers(customers);

        } catch (error) {
            ErrorHelper.throwServerError('Kupci');
        }
    };

    static async findCustomerById(customerId) {
        try {
            const customer = await CustomerModel.findById(customerId)
                .populate({
                    path: "orders",
                    select: "date totalPrice status",
                    options: { sort: { date: -1 } }
                });
                
            if (!customer) {
                ErrorHelper.throwNotFoundError("Kupac");
            }

            return this.mapCustomerDetails(customer);
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async createNewCustomer(firstName, lastName, email, telephone, address, session) {
        try {
            const encryptedLastName = CryptoService.encryptData(lastName);
            const encryptedTelephone = CryptoService.encryptData(telephone);
            const encryptedStreet = CryptoService.encryptData(address.Adresa.Ulica);
            const encryptedNumber = CryptoService.encryptData(address.Adresa.Broj);
    
            const newAddress = {
                city: address.Adresa.Grad,
                street: encryptedStreet,
                number: encryptedNumber,
                postalCode: address.Adresa["Poštanski Broj"]
            };
    
            let existingCustomer = await CustomerModel.findOne({ email: email }).session(session);
    
            if (!existingCustomer) {
                const newCustomer = new CustomerModel({
                    firstName: firstName,
                    lastName: encryptedLastName,
                    email: email,
                    telephoneNumber: [{ number: encryptedTelephone }],
                    address: [newAddress]
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

    static async updateCustomerOrders(customerId, orderId, session) {
        try {
            const customer = await CustomerModel.findById(customerId)
                .select("orders").session(session);

            if (!customer) {
                return {status: false, msg: "Kupac nije pronađen!"};
            }

            customer.orders.push(orderId);

            return await customer.save({ session });
        } catch (error) {
            return {status: false, msg: error};
        }
    }

    static mapCustomers(customers) {
        return customers.map((customer) => ({
            ID: { value: customer._id },
            Ime: { value: customer.firstName },
            Email: { value: customer.email },
            Gradovi: { value: [...new Set(customer.address.map(addr => addr.city))].join(", ") }
        }))
    }

    static mapCustomerDetails(customer) {
        return {
            ID: { value: customer._id },
            Ime: { value: customer.firstName },
            Prezime: { value: CryptoService.decryptData(customer.lastName) },
            Email: { value: customer.email },
            "Brojevi Telefona": customer.telephoneNumber.map((numb) => ({
                Broj: { value: CryptoService.decryptData(numb.number) }
            })),
            Adrese: customer.address.map((add) => ({
                Grad: { value: add.city },
                Ulica: { value: CryptoService.decryptData(add.street) },
                Broj: { value: CryptoService.decryptData(add.number) },
                "Poštanski Broj": { value: add.postalCode }
            })),
            Porudžbine: customer.orders.map((order) => ({
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
        }
    }
}

export default CustomerService;