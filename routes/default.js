import { Router } from "express";

const router = Router();
import { body, param, query } from 'express-validator';
import DefaultController from '../controller/defaultController.js';
import sanitizeHtml from 'sanitize-html';

router.get("/", DefaultController.getHomePage);

router.get('/uslovi-koriscenja', DefaultController.getTermsPage);

router.get("/politika-privatnosti", DefaultController.getPrivacyPage);

router.get("/kontakt", DefaultController.getContactPage);

router.get("/o-nama", DefaultController.getAboutPage);

router.get("/partnerstvo", DefaultController.getPartnershipPage);

router.post('/kontaktiranje', [
    body("name")
        .trim()
        .notEmpty().withMessage("Ime je obavezno.")
        .isLength({ min: 2, max: 50 }).withMessage("Ime mora imati između 2 i 50 karaktera.")
        .escape(),
    
    body("email")
        .trim()
        .notEmpty().withMessage("Email je obavezan.")
        .isEmail().withMessage("Unesite validan email.")
        .normalizeEmail(),
    
    body("title")
        .trim()
        .isIn(["Informacije", "Pitanje", "Partnerstvo", "Nalog"]).withMessage("Neispravan naslov."),

    body("phone")
        .optional({ checkFalsy: true })
        .matches(/^\+?[0-9\s-]{6,20}$/).withMessage("Unesite validan broj telefona."),
    
    body("msg")
        .trim()
        .notEmpty().withMessage("Poruka je obavezna.")
        .isLength({ min: 10, max: 1000 }).withMessage("Poruka mora imati između 10 i 1000 karaktera.")
        .customSanitizer((value) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })),
    
    body("honeypot")
        .custom((value) => {
        if (value) {
            throw new Error("Spam detektovan.");
        }
        return true;
        })
], DefaultController.postContact);

export default router;