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
        const search = req.query.search;
        let customers;

        if (search) {
            customers = await CustomerService.findCustomers(search);
        } else {
            customers = await CustomerService.findCustomers();
        }

        return res.render("admin/customer/customers", {
            path: "/admin/kupci",
            pageTitle: "Admin Kupci",
            pageDescription: "Prikaz svih Kupaca za admina",
            pageKeyWords: "Admin, Kupci, Upravljanje, Informacije",
            customers: customers
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

        const customer = await CustomerService.findCustomerById(customerId);

        return res.render("admin/customer/customer-details", {
            path: "/admin/kupac-detalji",
            pageTitle: "Profil Kupca",
            pageDescription: "Prikaz profila kupca, sve informacije i porudžbine",
            pageKeyWords: "Admin, Kupac Detalji, Informacije, Porudzbine",
            customer: customer
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

        return res.redirect(`/admin/kupci?search=${search}`);
    } catch (error) {
        next(error);
    }
}

export default {
    getCustomersPage,
    getCustomerProfilePage,
    postSearchCustomer
}