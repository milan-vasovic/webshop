import ContactModel from '../model/contact.js';

import CryptoService from './cryptoService.js';
import EmailService from './emailService.js';

import ErrorHelper from '../helper/errorHelper.js';

class ContactService {
    static async findAllContacts() {
        try {
            const contacts = await ContactModel.find()
                .select("firstName email title date")

            return this.mapContacts(contacts);

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

    static async findContactBySearch(filter, skip, limit) {
        const contacts = await ContactModel.find(filter)
                    .select("firstName email title date")
                    .skip(skip)
                    .limit(limit)
                    .lean();
                
        if (!contacts) {
            ErrorHelper.throwNotFoundError("Kontakt");
        }
            
        return this.mapContacts(contacts);
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
            Datum: {value: contact.date },
        }
    }
}

export default ContactService;