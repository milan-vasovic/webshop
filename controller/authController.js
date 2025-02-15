import {validationResult} from 'express-validator';
import sanitize from 'mongo-sanitize';
import UserService from '../service/userService.js';
import CryptoService from '../service/cryptoService.js';

async function getRegistrationPage(req, res, next) {
    try {
        return res.render("auth/register", {
            path: "/registracija",
            pageTitle: "Registrujte Se",
            pageDescription: "Registrujte se na našu prodavnicu i olakšano pratite i poručujte",
            pageKeyWords: "Registracija, Webshop, Prodavnica, Odeća",
            existingData: null,
            errorMessage: ""
        })
    } catch (error) {
        next(error);
    }
}

async function getLoginPage(req, res, next) {
    try {
        if (res.locals.role !== 'guest') {
            return res.redirect('/');
        }

        const redirectUrl = req.query.redirectTo || '/moj-profil';

        return res.render("auth/login", {
            path: "/prijava",
            pageTitle: "Prijavite Se",
            pageDescription: "Prijavite se na našu prodavnicu i olakšano pratite i poručujte",
            pageKeyWords: "Prijava, Webshop, Prodavnica, Odeća",
            existingData: null,
            errorMessage: "",
            redirectTo: redirectUrl
        })
    } catch (error) {
        next(error);
    }
}

async function getNewPasswordPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        next(error);
    }
}

async function getSetNewPasswordPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        next(error);
    }
}

async function postLogin(req, res, next) {
    try {
        const email = sanitize(req.body.email);
        const password = sanitize(req.body.password);
        const redirectUrl = sanitize(req.body.redirectTo) || '/moj-profil';

        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.render("auth/login", {
                path: "/prijava",
                pageTitle: "Prijavite Se",
                pageDescription: "Prijavite se na našu prodavnicu i olakšano pratite i poručujte",
                pageKeyWords: "Prijava, Webshop, Prodavnica, Odeća",
                existingData: {
                    email: email
                },
                errorMessage: errors.array()[0].msg,
                redirectTo: redirectUrl
            })
        }

        const userExist = await UserService.checkUserInfo(email, password);

        if(!userExist) {
            return res.render("auth/login", {
                path: "/prijava",
                pageTitle: "Prijavite Se",
                pageDescription: "Prijavite se na našu prodavnicu i olakšano pratite i poručujte",
                pageKeyWords: "Prijava, Webshop, Prodavnica, Odeća",
                existingData: {
                    email: email
                },
                errorMessage: "Nije moguće naći korisnika!",
                redirectTo: redirectUrl
            })
        }

        const checkPassword = await CryptoService.compareUserPasswords(password, userExist.password);

        if (!checkPassword) {
            return res.render("auth/login", {
                path: "/prijava",
                pageTitle: "Prijavite Se",
                pageDescription: "Prijavite se na našu prodavnicu i olakšano pratite i poručujte",
                pageKeyWords: "Prijava, Webshop, Prodavnica, Odeća",
                existingData: {
                    email: email
                },
                errorMessage: "Neispravni podaci!",
                redirectTo: redirectUrl
            })
        }

        const sessionCart = req.session.cart;
        if (sessionCart) {
            await UserService.updateCartWithSessionCart(userExist._id, sessionCart);
        }

        const user = await UserService.findUserForSession(userExist._id);

        if (user) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.guest = false;

            res.redirect(redirectUrl);
        }
    } catch (error) {
        next(error);
    }
}

async function postRegister(req, res, next) {
    try {
        const email = sanitize(req.body.email);
        const password = sanitize(req.body.password);
        const firstname = sanitize(req.body.firstname);
        const lastname = sanitize(req.body.lastname);

        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.render("auth/register", {
                path: "/registracija",
                path: "/registracija",
                pageTitle: "Registrujte Se",
                pageDescription: "Registrujte se na našu prodavnicu i olakšano pratite i poručujte",
                pageKeyWords: "Registracija, Webshop, Prodavnica, Odeća",
                existingData: {
                    email: email,
                    firstname: firstname,
                    lastname: lastname,
                    acceptance: acceptance
                },
                errorMessage: errors.array()[0].msg,
            })
        }

        const newUser = await UserService.createNewUser(email, password, firstname, lastname);

        if (newUser) {
            res.redirect('/prijava');
        }
    } catch (error) {
        next(error)
    }
}

function postLogout(req, res, next) {
    try {
        req.session.destroy(() => {
            res.redirect("/");
        });
    } catch (error) {
        next(error);
    }
}
export default {
    getRegistrationPage,
    getLoginPage,
    getNewPasswordPage,
    getSetNewPasswordPage,
    postLogin,
    postLogout,
    postRegister
}