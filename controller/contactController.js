import ErrorHelper from '../helper/errorHelper.js';
import ContactService from '../service/contactService.js';
import sanitize from 'mongo-sanitize';

async function getContactsPage(req, res, next) {
    try {
        const search = req.query.search;
        if (search) {
            const filter = {
                $or: [
                    { _id: search },
                    { title: { $regex: search, $options: "i" } },
                    { categories: { $regex: search, $options: "i" } },
                    { tags: { $regex: search, $options: "i" } },
                    { keyWords: { $regex: search, $options: "i" } },
                    { status: { $regex: search, $options: "i" } },
                ],
            };
        
            const contacts = await ContactService.findContactBySearch(filter);

            return res.render("admin/contact/contacts", {
                path: "/admin/kontakti",
                pageTitle: "Kontakti",
                pageDescription: "Prikaz svih kontakta za admina",
                pageKeyWords: "Admin, Kontakti, Upravljanje",
                contacts: contacts
            })
        }

        const contacts = await ContactService.findAllContacts();

        return res.render("admin/contact/contacts", {
            path: "/admin/kontakti",
            pageTitle: "Kontakti",
            pageDescription: "Prikaz svih kontakta za admina",
            pageKeyWords: "Admin, Kontakti, Upravljanje",
            contacts: contacts
        })

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

async function getContactDetailsPage(req, res, next) {
    try {
        const contactId = req.params.contactId;

        const contact = await ContactService.findContactById(contactId);

        return res.send(({contact: contact}))

    } catch (error) {
        ErrorHelper.throwServerError(error);
    }
}

async function postSearchContact(req, res, next) {
    try {
        const search = sanitize(req.body.search);

        if (!search) {
            return res.redirect("/admin/kontakti");
        }

        return res.redirect(`/admin/kontakti?search=${search}`);
    } catch (error) {
        next(error)
    }
}

export default {
    getContactsPage,
    getContactDetailsPage,
    postSearchContact
}