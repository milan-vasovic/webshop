import sanitize from 'mongo-sanitize';

import ContactService from '../service/contactService.js';

/**
 * Renders the contacts page.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
async function getContactsPage(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const contacts = await ContactService.findAllContacts(limit, page);
        const totalPages = Math.ceil(contacts.totalCount / limit);

        return res.render("admin/contact/contacts", {
            path: "/admin/kontakti",
            pageTitle: "Kontakti",
            pageDescription: "Prikaz svih kontakta za admina",
            pageKeyWords: "Admin, Kontakti, Upravljanje",
            contacts: contacts,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/kontakti`,
            index: false,
            featureImage: undefined,
        })

    } catch (error) {
        next(error)
    }
}

async function getContactsSearchPage(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const search = req.params.search ? req.params.search : "";
        
        const param = sanitize(search)

        const contacts = await ContactService.findContactBySearch(param, limit, page);
        const totalPages = Math.ceil(contacts.totalCount / limit);

        return res.render("admin/contact/contacts", {
            path: "/admin/kontakti",
            pageTitle: "Kontakti",
            pageDescription: "Prikaz svih kontakta za admina",
            pageKeyWords: "Admin, Kontakti, Upravljanje",
            contacts: contacts,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/kontakti/pretraga/${search}`,
            index: false,
            featureImage: undefined,
        })
    } catch (error) {
        next(error);
    }
}

/**
 * Renders the contact details page.
 */
async function getContactDetailsPage(req, res, next) {
    try {
        const contactId = req.params.contactId;

        const contact = await ContactService.findContactById(contactId);

        return res.render("admin/contact/contact-details", {
            path: "/admin/kontakt-detlji",
            pageTitle: "Detalji kontakta",
            pageDescription: "Prikaz detalja kontakta za admina",
            pageKeyWords: "Admin, Kontakti, Detalji",
            contact: contact,
            index: false,
            featureImage: undefined,
        })

    } catch (error) {
        next(error)
    }
}

/**
 * Handles the search form submission for contacts.
 */
async function postSearchContact(req, res, next) {
    try {
        const search = sanitize(req.body.search);

        if (!search) {
            return res.redirect("/admin/kontakti");
        }

        return res.redirect(`/admin/kontakti/pretraga/${search}`);
    } catch (error) {
        next(error)
    }
}

export default {
    getContactsPage,
    getContactsSearchPage,
    getContactDetailsPage,
    postSearchContact
}