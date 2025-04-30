import ContactModel from '../model/contact.js';

import CryptoService from './cryptoService.js';
import EmailService from './emailService.js';

import ErrorHelper from '../helper/errorHelper.js';

import mongoose from "mongoose";

class ContactService {
    static async findAllContacts(limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;

            const [contacts, totalCount] = await Promise.all([
                ContactModel.find()
                    .sort({ date: -1 })
                    .select("firstName email title date")
                    .skip(skip)
                    .limit(limit),
                ContactModel.countDocuments()
            ]);

            if (!contacts) {
                ErrorHelper.throwNotFoundError("Kontakt");
            }

            return {
                contacts: this.mapContacts(contacts),
                totalCount: totalCount,
           };

        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findContactById(contactId) {
        try {
            const contact = await ContactModel.findById(contactId);

            if (!contact) {
                ErrorHelper.throwNotFoundError("Kontakt")
            }

            return this.mapContactDetails(contact);

        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findContactBySearch(search, limit = 10, page = 1) {
        const skip = (page - 1) * limit;
        let filter = {};
        const isValidObjectId = mongoose.Types.ObjectId.isValid(search);

        if (search) {
            filter = {
                $or: [
                    ...(isValidObjectId ? [{ _id: search }] : []),
                    { title: { $regex: search, $options: "i" } },
                    { firstName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ]
            };
        }

        const [contacts, totalCount] = await Promise.all([
            ContactModel.find(filter)
                .sort({ date: -1 })
                .select("firstName email title date")
                .skip(skip)
                .limit(limit),
            ContactModel.countDocuments(filter)
            ]);

        if (!contacts) {
            ErrorHelper.throwNotFoundError("Kontakt");
        }
        return {
            contacts: this.mapContacts(contacts),
            totalCount: totalCount,
        };
    }

    static async createContact(name, email, title, msg, phone=null) {
        try {
            const securePhone = await CryptoService.encryptData(phone);
            const secrueMsg = await CryptoService.encryptData(msg);
            const newContact = new ContactModel({
                firstName: name,
                email: email,
                telephoneNuber: securePhone,
                title: title,
                message: secrueMsg,
            })

            newContact.save();

            EmailService.sendNewContactNotification(newContact.firstName, newContact.email, newContact._id);

            return newContact;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static mapContacts(contacts) {
        return contacts.map((contact) => ({
            ID: {value: contact._id },
            Ime: {value: contact.firstName },
            Email: {value: contact.email },
            Naslov: {value: contact.title },
            Datum: {value: contact.date },
            })
        )
    }

    static mapContactDetails(contact){
        return {
            ID: {value: contact._id },
            Ime: {value: contact.firstName },
            Email: {value: contact.email },
            "Broj Telefona": {value: CryptoService.decryptData(contact.telephoneNuber) },
            Naslov: {value: contact.title },
            Poruka: {value: CryptoService.decryptData(contact.message) },
            Datum: {value: contact.date.toLocaleDateString("sr-RS", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }) },
        }
    }
}

export default ContactService;