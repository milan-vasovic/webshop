import { Router } from "express";
import { body } from 'express-validator'; //  param, query, validationResult 

import AuthController from '../controller/authController.js';
import authController from "../controller/authController.js";

const router = Router();

router.get("/prijava", AuthController.getLoginPage);

router.get("/registracija", AuthController.getRegistrationPage);

router.get("/zatrazite-novu-sifru", AuthController.getNewPasswordPage);

router.get("/napravite-novu-sifru/:token", AuthController.getSetNewPasswordPage);

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

router.post("/zatrazite-novu-sifru", [
    body("email")
    .notEmpty()
    .withMessage("Email adresa je obavezna."),
], AuthController.postRequestNewPassword);

router.post("/napravite-novu-sifru", [ 
    body("password")
        .notEmpty()
        .withMessage("Šifra je obavezna."),

    body("confirmedPassword")
        .notEmpty()
        .withMessage("Potvrđena šifra je obavezna."),

    body("confirmedPassword")
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Šifre se ne poklapaju.");
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
], AuthController.postSetNewPassword);

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