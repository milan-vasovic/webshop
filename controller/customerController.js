import ErrorHelper from '../helper/errorHelper.js';
import CustomerService from '../service/customerService.js';

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
        ErrorHelper.throwServerError(error);
    }
}

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
        ErrorHelper.throwServerError(error);
    }
}

export default {
    getCustomersPage,
    getCustomerProfilePage
}