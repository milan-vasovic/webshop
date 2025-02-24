import { Router } from "express";
import { body } from 'express-validator';

import ShopController from '../controller/shopController.js';

const router = Router();

router.get("", ShopController.getShopPage);

router.get("/pretraga/:search", ShopController.getShopPageBySearch);

router.get("/kategorija/:category", ShopController.getShopPageByCategory);

router.get("/oznaka/:tag", ShopController.getShopPageByTag);

router.get('/istaknuto', ShopController.getFeautredShopPage);

router.get('/akcija', ShopController.getActionedShopPage);

router.get("/artikal/:itemName", ShopController.getItemByName);

router.get('/korpa', ShopController.getCartPage);

router.get('/porudzbina', ShopController.getCheckOutPage);

router.post("/pretraga", ShopController.postShopSearch);

router.post('/backorder-dodavanje', ShopController.postAddItemToBackorder);

router.post('/korpa-dodavanje', ShopController.postAddItemToCart);

router.post("/provera-kupona", ShopController.postCouponValidation);

router.post("/porucivanje", [
    body('firstName')
    .trim()
    .notEmpty().withMessage('Ime je obavezno.')
    .matches(/^[\p{L}\s-]+$/u).withMessage('Ime može sadržavati samo slova.'),

    // Prezime: obavezno, trim-ovano
    body('lastName')
    .trim()
    .notEmpty().withMessage('Prezime je obavezno.')
    .matches(/^[\p{L}\s-]+$/u).withMessage('Prezime može sadržavati samo slova.'),

    // Email: obavezan i validan
    body('email')
    .trim()
    .notEmpty().withMessage('Email je obavezan.')
    .isEmail().withMessage('Email mora biti validan.'),

    // Broj telefona: ako se koristi postojeći broj, očekuje se da polje bude popunjeno i da sadrži validan broj
    body('telephone')
    .if((value, { req }) => !req.body.isNewTelephone)
    .trim()
    .notEmpty().withMessage('Broj telefona je obavezan.')
    .isMobilePhone('any').withMessage('Broj telefona mora biti validan.'),

    // Novi broj telefona: ako postoji flag isNewTelephone, onda je polje newTelephone obavezno i mora biti validno
    body('newTelephone')
    .if((value, { req }) => req.body.isNewTelephone)
    .trim()
    .notEmpty().withMessage('Novi broj telefona je obavezan.')
    .isMobilePhone('any').withMessage('Novi broj telefona mora biti validan.'),

    // Ako korisnik ima unapred definisane adrese (odabir iz selecta) – polje address se ne validira dodatno,
    // ali ako korisnik nije prijavljen (ili želi da unese novu adresu) onda očekujemo unos podataka:
    body('address')
    .optional({ checkFalsy: true })
    .trim(),

    // Dinamički unos nove adrese: ako postoji flag isNewAddress, tada su newCity, newStreet i newAddressNumber obavezni.
    body('newCity')
    .if((value, { req }) => req.body.isNewAddress)
    .trim()
    .notEmpty().withMessage('Grad je obavezan.'),
    body('newStreet')
    .if((value, { req }) => req.body.isNewAddress)
    .trim()
    .notEmpty().withMessage('Ulica je obavezna.'),
    body('newAddressNumber')
    .if((value, { req }) => req.body.isNewAddress)
    .trim()
    .notEmpty().withMessage('Broj ulice je obavezan.'),
    body('newPostalCode')
    .if((value, { req }) => req.body.isNewAddress)
    .optional({ checkFalsy: true })
    .trim()
    .isPostalCode('any').withMessage('Poštanski broj mora biti validan.'),

    // Ako korisnik nije prijavljen (nema adrese u sistemu) – validiraju se polja za unos adrese iz forme (npr. city, street, number)
    body('newCity')
    .if((value, { req }) => !req.body.address)
    .trim()
    .notEmpty().withMessage('Grad je obavezan.'),
    body('newStreet')
    .if((value, { req }) => !req.body.address)
    .trim()
    .notEmpty().withMessage('Ulica je obavezna.'),
    body('newAddressNumber')
    .if((value, { req }) => !req.body.address)
    .trim()
    .notEmpty().withMessage('Broj ulice je obavezan.'),
    body('newPostalCode')
    .if((value, { req }) => !req.body.address)
    .optional({ checkFalsy: true })
    .trim()
    .isPostalCode('any').withMessage('Poštanski broj mora biti validan.'),

    // Saglasnost: mora biti prihvaćena (ako checkbox nije čekiran, vrednost će biti undefined)
    body('acceptance')
    .custom((value) => {
    if (!value) {
        throw new Error('Morate prihvatiti uslove korišćenja i politiku privatnosti.');
    }
    return true;
    }),

    body('couponId')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3 }).withMessage('Kupon mora imati najmanje 3 karaktera.')
    .matches(/^[\p{L}\d\s-]+$/u)
    .withMessage('Kupon sadrži nevažeće karaktere.'),

    // Honeypot: mora biti prazno
    body('honeypot')
    .custom((value) => {
    if (value && value.trim() !== '') {
        throw new Error('Nevalidan zahtev.');
    }
    return true;
    }),

    // CSRFToken: mora biti prisutan
    body('CSRFToken')
    .trim()
    .notEmpty().withMessage('CSRF token je obavezan.')
], ShopController.postOrder);

router.delete('/korpa-izbacivanje', ShopController.postRemoveItemFromCart);

export default router;