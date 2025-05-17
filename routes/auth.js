import { Router } from "express";
import { body } from 'express-validator'; //  param, query, validationResult 

import {
  loginLimiter,
  resetPasswordLimiter,
} from '../middleware/rateLimiter.js';

import AuthController from '../controller/authController.js';
import authController from "../controller/authController.js";

const router = Router();

router.get("/prijava", AuthController.getLoginPage);

router.get("/registracija", AuthController.getRegistrationPage);

router.get("/zatrazite-novu-sifru", resetPasswordLimiter, AuthController.getNewPasswordPage);

router.get("/zatrazite-aktivaciju",  resetPasswordLimiter, AuthController.getActivationAccount);

router.get("/napravite-novu-sifru/:token", AuthController.getSetNewPasswordPage);

router.get('/auth/confirm', authController.getConfirmAccountPage);

router.post('/prijava', loginLimiter, [
    body("email")
        .trim()
        .notEmpty().withMessage("Email adresa je obavezna.")
        .isEmail().withMessage("Email adresa nije validna.")
        .normalizeEmail(),

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

router.post('/registracija', loginLimiter, [
    body("email")
        .trim()
        .notEmpty().withMessage("Email adresa je obavezna.")
        .isEmail().withMessage("Email adresa nije validna.")
        .normalizeEmail(),

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

router.post("/zatrazite-novu-sifru", resetPasswordLimiter, [
    body("email")
        .trim()
        .notEmpty().withMessage("Email adresa je obavezna.")
        .isEmail().withMessage("Email adresa nije validna.")
        .normalizeEmail(),
], AuthController.postRequestNewPassword);

router.post("/zatrazite-aktivaciju", resetPasswordLimiter, [
    body("email")
        .trim()
        .notEmpty().withMessage("Email adresa je obavezna.")
        .isEmail().withMessage("Email adresa nije validna.")
        .normalizeEmail(),
], AuthController.postRequestActivation);

router.post("/napravite-novu-sifru", resetPasswordLimiter, [ 
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