import { Router } from "express";
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

import AuthController from '../controller/authController.js';
import authController from "../controller/authController.js";

router.get("/prijava", AuthController.getLoginPage);

router.get("/registracija", AuthController.getRegistrationPage);

router.get("/zatrazite-novu-sifru", AuthController.getNewPasswordPage);

router.get("/napravite-novu-sifru", AuthController.getSetNewPasswordPage);

router.post('/prijava', [
    body("email")
        .notEmpty()
        .withMessage("Email adresa je obavezna."),

    body("password")
        .notEmpty()
        .withMessage("Šifra je obavezna."),

    body("honeypot")
        .custom((value) => {
        if (value) {
            throw new Error("Spam detektovan.");
        }
        return true;
        })
], authController.postLogin);

router.post('/registracija', [
    body("email")
    .notEmpty()
    .withMessage("Email adresa je obavezna."),

    body("password")
        .notEmpty()
        .withMessage("Šifra je obavezna."),

    body("confirmedPassword")
        .notEmpty()
        .withMessage("Potvrđena šifra je obavezna."),
        
    body("firstname")
        .notEmpty()
        .withMessage("Ime je obavezno."),
        
    body("lastname")
        .notEmpty()
        .withMessage("Prezime je obavezno."),

    body('acceptance')
        .custom((value) => {
        if (!value) {
            throw new Error('Morate prihvatiti uslove.');
        }
        return true;
        }),

    body("honeypot")
        .custom((value) => {
        if (value) {
            throw new Error("Spam detektovan.");
        }
        return true;
        })
], authController.postRegister);

router.post('/odjava', [
    body("honeypot")
        .custom((value) => {
        if (value) {
            throw new Error("Spam detektovan.");
        }
        return true;
        })
], AuthController.postLogout);

export default router;