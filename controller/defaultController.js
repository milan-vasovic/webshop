import ErrorHelper from '../helper/errorHelper.js';
import { validationResult } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import sanitize from 'mongo-sanitize';
import ContactService from '../service/contactService.js';

async function getHomePage(req, res, next) {
    try {
        return res.render("leanding/leanding-page", {
            path: "/",
            pageTitle: "Pocetna"
        })

    } catch (error) {
        next(error);
    }
}

async function getAboutPage(req, res, next) {
    try {
        return res.render("shop/shop")

    } catch (error) {
        next(error);
    }
}

async function getPrivacyPage(req, res, next) {
    try {
        return res.render("public/privacy-policy", {
            path: "/politika-privatnosti",
            pageTitle: "Politika Privatnosti",
            pageDescription: "Naša politika privatnosti, sve na jednom mestu, sve potrebne informacije šta i kako prikupljamo, u koju svrhu i vaša prava",
            pageKeyWords: "Politika Privatnosti, Informacije, Prava",
        })

    } catch (error) {
        next(error);
    }
}

async function getTermsPage(req, res, next) {
    try {
        return res.render("public/tearms-conditions", {
            path: "/uslovi-koriscenja",
            pageTitle: "Uslovi Koriscenja",
            pageDescription: "Naši uslovi korišćenja, pravila, odgovornost, prihvatnaje, saglasnost, mere i ostale inforamcije.",
            pageKeyWords: "Uslovi Korišćenja, Pravila, Informacije, Mere, Obaveze",
        })

    } catch (error) {
        next(error);
    }
}

async function getContactPage(req, res, next) {
    try {
        return res.render("public/contact", {
            path: "/kontakt",
            pageTitle: "Kontaktirajte Nas",
            pageDescription: "Kontaktirjate nas brzo, lako putem forme ili telefona. Tu smo za sve informacije, pitanja i nedoumice, slobodno nas kontaktirajte, a potrudićemo se da vam odgovorimo u najkraćem roku!",
            pageKeyWords: "Kontakt, Pitanja, Kontaktirajte Nas, Pozovite",
            errorMessage: "",
            existingData: {}
        })
    } catch (error) {
        next(error);
    }
}

async function getPartnershipPage(req, res, next) {
    try {
        return res.render("partnership/partnership", {
            path: "/partnerstvo",
            pageTitle: "Postanite Partneri"
        })
    } catch (error) {
        next(error);
    }
}

async function postContact(req, res, next) {
    try {
        const name = sanitize(req.body.name);
        const email = sanitize(req.body.email);
        const title = sanitize(req.body.title);
        const phone = sanitize(req.body.phone || null)
        const msg = sanitizeHtml(req.body.msg);

        const errors = validationResult(req);
        
        if(!errors.isEmpty()) {
            return res.render('public/contact', {
                path: 'Kontakt',
                pageTitle: "Kontaktirajte Nas",
                pageDescription: "Kontaktirjate nas brzo, lako putem forme ili telefona. Tu smo za sve informacije, pitanja i nedoumice, slobodno nas kontaktirajte, a potrudićemo se da vam odgovorimo u najkraćem roku!",
                pageKeyWords: "Kontakt, Pitanja, Kontaktirajte Nas, Pozovite",
                errorMessage: errors.array()[0].msg,
                existingData: {
                    name: name,
                    email: email,
                    tilte: title,
                    phone: phone,
                    msg: msg,
                }
            })
        }

        const isAdded = await ContactService.createContact(name, email, title, msg, phone);

        if (isAdded) {
            return res.render('email/success', {
                path: '/uspesno-poslato',
                pageTitle: "Uspešno ste poslali poruku!",
                pageDescription: "Stranica obaveštenja o uspešnom slanju kontakt forme",
                pageKeyWords: "Useph, Kontakt",
                message: "Hvala Vam na kontaktu, Vaša poruka je uspešno poslata. Odgovorićemo Vam u što kraćem roku!"
            });
        }
    } catch (error) {
        next(error);
    }
}
export default {
    getHomePage,
    getAboutPage,
    getPrivacyPage,
    getTermsPage,
    getContactPage,
    getPartnershipPage,
    postContact
}