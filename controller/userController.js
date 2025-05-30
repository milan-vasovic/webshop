import sanitize from 'mongo-sanitize';

import UserService from '../service/userService.js';
import OrderService from '../service/orderService.js';

async function getUsersPage(req, res, next) {
    try {
        // Getting user _id from logged user so i don't show him
        const userId = req.session.user._id;

        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 10;

        const users = await UserService.findUsers(userId, limit, page);
        const totalPages = Math.ceil(users.totalCount / limit);

        return res.render("admin/user/users", {
            path: "/admin/korisnici",
            pageTitle: "Korisnici",
            pageDescription: "Admin prikaz svih korisnika, detalji i brisanje",
            pageKeyWords: "Admin, Korisnici, Upravljanje, Informacije",
            users: users,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/korisnici`,
            index: false,
            featureImage: undefined,
        })

    } catch (error) {
        next(error);
    }
}

async function getUserBySearchPage(req, res, next) {
    try {
        const userId = req.session.user._id;
        const search = req.query.search ? sanitize(req.query.search) : null;

        if (!search) {
            return res.redirect("/admin/korisnici");
        }

        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 10;

        const users = await UserService.findUsersBySearch(userId, search, limit, page);
        const totalPages = Math.ceil(users.totalCount / limit);

        return res.render("admin/user/users", {
            path: "/admin/korisnici",
            pageTitle: "Korisnici Pretraga: " + search,
            pageDescription: "Admin prikaz svih korisnika, detalji i brisanje",
            pageKeyWords: "Admin, Korisnici, Upravljanje, Informacije",
            users: users,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/korisnici/pretraga/${search}`,
            index: false,
            featureImage: undefined,
        })
    } catch (error) {
        next(error)
    }
}
async function getUserByIdPage(req, res, next) {
    try {
        const userId = req.params.userId;

        const user = await UserService.findUserById(userId);

        return res.render('admin/user/user-details', {
            path: "/admin/korisnik-detalji" + userId,
            pageTitle: user.Ime.value,
            pageDescription: "Profili korisnika, informacije, detalji, upravljanje",
            pageKeyWords: "Admin, Korisnik Profil, Upravljanje, Informacije",
            user: user,
            index: false,
            featureImage: undefined,
        });

    } catch (error) {
        next(error);
    }    
}

async function getMyProfilePage(req, res, next) {
    try {
        const userId = req.session.user._id;

        const user = await UserService.findUserById(userId);

        return res.render("user/my-profile", {
                path: "/moj-profil",
                pageTitle: "Moj Profil",
                pageDescription: "Prikaz profila korisnikaa",
                pageKeyWords: "Profil, Porudzbine, Adrese, Brojevi",
                user: user,
                index: false,
                featureImage: undefined,
        })
    } catch (error) {
        next(error);
    }
}

async function getMyShopPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        next(error);
    }
}

async function getUserOrderDetails(req, res, next) {
    try {
        const orderId = req.params.itemId;
        const userId = req.session.user?._id;

        if (userId) {
            const order = await OrderService.findUserOrderDetails(orderId, userId);

            return res.render('user/order-details', {
                path: "/porudzbina-detalji" + orderId,
                pageTitle: "Porudžbina Detalji",
                pageDescription: "Prikaz svih detalja porudžbine korisnika",
                pageKeyWords: "Porudžbine, Detalji, Korisnik, Informacije",
                order: order,
                index: false,
                featureImage: undefined,
            })
        }

        return res.redirect('/moj-profil');
    } catch (error) {
        next(error);
    }
}

async function postAddNumber(req, res, next) {
    try {
        const phoneNumber = sanitize(req.body.telephone);
        const userId = req.session.user._id;

        const isAdded = await UserService.addPhoneNumberToUser(phoneNumber, userId);

        if (isAdded) {
            return res.status(200).json({ message: "Broj telefona uspešno dodat!" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function postAddAddress(req, res, next) {
    try {
        const city = sanitize(req.body.city);
        const street = sanitize(req.body.street);
        const number = sanitize(req.body.number);
        const postalCode = req.body.postalCode ? sanitize(req.body.postalCode) : '';
        const userId = req.session.user._id;

        const isAdded = await UserService.addAddressToUser(city, street, number, postalCode, userId);

        if (isAdded) {
            return res.status(200).json({ message: "Adresa uspešno dodata!" });
        }

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

function postSearchUser(req, res, next) {
    try {
        const search = sanitize(req.body.search);
        if (!search) {
            return res.redirect("/admin/korisnici");
        }

        return res.redirect(`/admin/korisnici/pretraga/${search}`);
    } catch (error) {
        next(error);
    }
}

async function postCancelOrder(req, res, next) {
    try {
        const userId = req.session.user._id;
        const orderId = sanitize(req.body.orderId);

        const order = await OrderService.cancelOrder(orderId, userId);

        return res.redirect('/korisnik/porudzbina-detalji/'+orderId);
    } catch (error) {
        next(error);
    }
}

async function deleteNumber(req, res, next) {
    try {
        const numberId = req.body.itemId;
        const userId = req.session.user._id;

        const isDeleted = await UserService.deletePhoneNumberFromUser(numberId, userId);

        if (isDeleted) {
            return res.status(200).redirect('/moj-profil');
        }
    } catch (error) {
        next(error);
    }
}

async function deleteAdressById(req, res, next) {
    try {
        const addressId = req.body.itemId;

        const userId = req.session.user._id;

        const isDeleted = await UserService.deleteAddressFromUser(addressId, userId);

        if (isDeleted) {
            return res.status(200).redirect('/moj-profil');
        }
    } catch (error) {
        next(error);
    }
}

export default {
    getUsersPage,
    getUserBySearchPage,
    getUserByIdPage,
    getMyProfilePage,
    getMyShopPage,
    getUserOrderDetails,
    postAddNumber,
    postCancelOrder,
    deleteNumber,
    postAddAddress,
    postSearchUser,
    deleteAdressById
}