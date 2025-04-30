import sanitize from 'mongo-sanitize';

import CustomerService from '../service/customerService.js';

/**
 * Renders the customers page for the admin.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
async function getCustomersPage(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        const customers = await CustomerService.findCustomers(limit, page);
        const totalPages = Math.ceil(customers.totalCount / limit);

        return res.render("admin/customer/customers", {
            path: "/admin/kupci",
            pageTitle: "Admin Kupci",
            pageDescription: "Prikaz svih Kupaca za admina",
            pageKeyWords: "Admin, Kupci, Upravljanje, Informacije",
            customers: customers,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/kupci`,
            index: false,
            featureImage: undefined,
        })

    } catch (error) {
        next(error);
    }
}

async function getCustomersBySearchPage(req, res, next) {
    try {
        const search = req.params.search;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        const customers = await CustomerService.findCustomersBySearch(search, limit, page);
        const totalPages = Math.ceil(customers.totalCount / limit);

        return res.render("admin/customer/customers", {
            path: "/admin/kupci",
            pageTitle: "Admin Kupci Pretraga: " + search,
            pageDescription: "Prikaz svih Kupaca za admina",
            pageKeyWords: "Admin, Kupci, Upravljanje, Informacije",
            customers: customers,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/kupci/pretraga/${search}`,
            index: false,
            featureImage: undefined,
        })
    } catch (error) {
        next(error);
    }
}

/**
 * Renders the customer profile page for the admin.
 */
async function getCustomerProfilePage(req, res, next) {
    try {
        const customerId = req.params.customerId;
        const email = req.query.email;
    
        let customer;
        if (email) {
            customer = await CustomerService.findCustomerByEmail(email);

            return res.redirect(`/admin/korisnik-detalji/${customer._id}`);
        } else {
            customer = await CustomerService.findCustomerById(customerId);
        }

        return res.render("admin/customer/customer-details", {
            path: "/admin/kupac-detalji",
            pageTitle: "Profil Kupca",
            pageDescription: "Prikaz profila kupca, sve informacije i porudžbine",
            pageKeyWords: "Admin, Kupac Detalji, Informacije, Porudzbine",
            customer: customer,
            index: false,
            featureImage: undefined,
        })

    } catch (error) {
        next(error);
    }
}

/**
 * Handles the search form submission for customers.
 */
function postSearchCustomer(req, res, next) {
    try {
        const search = sanitize(req.body.search);
        if (!search) {
            return res.redirect("/admin/kupci");
        }

        return res.redirect(`/admin/kupci/pretraga/${search}`);
    } catch (error) {
        next(error);
    }
}

export default {
    getCustomersPage,
    getCustomersBySearchPage,
    getCustomerProfilePage,
    postSearchCustomer
}