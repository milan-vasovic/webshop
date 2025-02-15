import { Router } from "express";
import { body, param, query, validationResult } from 'express-validator';
import isAuth from '../middleware/isAuth.js';
import isAdmin from '../middleware/isAdmin.js';
const router = Router();

import AdminController from '../controller/adminController.js';
import ContactController from '../controller/contactController.js';
import CouponController from '../controller/couponController.js';
import CustomerController from '../controller/customerController.js';
import ForumController from '../controller/forumController.js';
import HistoryController from '../controller/historyController.js';
import OrderController from '../controller/orderController.js';
import UserController from '../controller/userController.js';
import ItemController from '../controller/itemController.js';

router.get("/dashboard", isAuth, isAdmin, AdminController.getDashboardPage);

router.get("/kontakti", isAuth, isAdmin, ContactController.getContactsPage);

router.get("/kontakt-detalji/:contactId", isAuth, isAdmin, ContactController.getContactDetailsPage);

router.get("/kuponi", isAuth, isAdmin, CouponController.getCouponsPage);

router.get("/kupon-detalji/:couponId", isAuth, isAdmin, CouponController.getCouponDetailsPage);

router.get("/dodajte-kupon", isAuth, isAdmin, CouponController.getAddCouponPage);

router.get("/kupci", isAuth, isAdmin, CustomerController.getCustomersPage);

router.get("/kupac-detalji/:customerId", isAuth, isAdmin, CustomerController.getCustomerProfilePage);

router.get("/korisnici", isAuth, isAdmin, UserController.getUsersPage);

router.get("/korisnik-detalji/:userId", isAuth, isAdmin, UserController.getUserByIdPage);

router.get("/artikli", isAuth, isAdmin, ItemController.getItemsPage);

router.get("/artikal-detalji/:itemId", isAuth, isAdmin, ItemController.getItemDetailsPage);

router.get("/dodajte-artikal", isAuth, isAdmin, ItemController.getAddItemPage);

router.get("/izmenite-artikal/:itemId", isAuth, isAdmin, ItemController.getEditItemPage);

router.get("/upsell-artikli", isAuth, isAdmin, ItemController.getAllUpSellItems);

router.get("/crosssell-artikli", isAuth, isAdmin, ItemController.getAllCrosSellItems);

router.get("/istorija", isAuth, isAdmin, HistoryController.getHistoryPage);

router.get("/istroja-detalji/:historyId", isAuth, isAdmin, HistoryController.getHistoryDetailsPage);

router.get("/forum", isAuth, isAdmin, ForumController.getAdminForumPage);

router.get("/objava/:postId", isAuth, isAdmin, ForumController.getAdminPostPage);

router.get("/dodajte-objavu", isAuth, isAdmin, ForumController.getAddPostPage);

router.get('/porudzbine', isAuth, isAdmin, OrderController.getOrdersPage);

router.get('/porudzbina-detalji/:orderId', isAuth, isAdmin, OrderController.getOrderDetailsPage);

// POST
router.post("/artikal-dodavanje", [
    body("title")
        .notEmpty()
        .withMessage("Title is required.")
        .isString()
        .withMessage("Title must be a string."),

    body("sku")
        .notEmpty()
        .withMessage("SKU is required.")
        .isString()
        .withMessage("SKU must be a string."),

    body("shortDescription")
        .notEmpty()
        .withMessage("Short description is required.")
        .isString()
        .withMessage("Short description must be a string."),

    body("keyWords")
        .isArray({ min: 1 })
        .withMessage("KeyWords must be an array with at least one value.")
        .custom((keyWords) => keyWords.every((key) => typeof key === "string"))
        .withMessage("All KeyWords must be strings."),

    body("description")
        .notEmpty()
        .withMessage("Description is required.")
        .isString()
        .withMessage("Description must be a string."),

    body("featureImageDesc")
        .notEmpty()
        .withMessage("Feature image description is required."),

    body("categories")
        .isArray({ min: 1 })
        .withMessage("Categories must be an array with at least one value.")
        .custom((categories) => categories.every((cat) => typeof cat === "string"))
        .withMessage("All categories must be strings."),

    body("tags")
        .isArray({ min: 1 })
        .withMessage("Tags must be an array with at least one value.")
        .custom((tags) => tags.every((tag) => typeof tag === "string"))
        .withMessage("All tags must be strings."),

    body("status")
        .isArray({ min: 1 })
        .withMessage("Status must be an array with at least one value.")
        .custom((status) => status.every((stat) => ["action", "featured", "empty", "normal"].includes(stat)))
        .withMessage("Invalid status value."),

    body("price")
        .notEmpty()
        .withMessage("Price is required.")
        .isNumeric()
        .withMessage("Price must be a number.")
        .isFloat({ min: 100 })
        .withMessage("Price must be at least 100."),

    body("actionPrice")
        .notEmpty()
        .withMessage("Action price is required.")
        .isNumeric()
        .withMessage("Action price must be a number.")
        .isFloat({ min: 100 })
        .withMessage("Action price must be at least 100."),

    body("variations")
        .optional()
        .isArray()
        .withMessage("Variations must be an array.")
        .custom((variations) =>
            variations.every((variation) =>
                ["size", "color", "amount", "imgDesc"].every((field) => field in variation)
            )
        )
        .withMessage("All variations must have size, color, amount"),

    body("variations.*.size")
        .isString()
        .withMessage("Variation size must be a string.")
        .isIn(["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "S/M", "M/L", "L/XL", "XL/2XL", "Uni"])
        .withMessage("Invalid variation size."),

    body("variations.*.color")
        .isString()
        .withMessage("Variation color must be a string."),

    body("variations.*.amount")
        .isNumeric()
        .withMessage("Variation amount must be a number.")
        .isInt({ min: 0 })
        .withMessage("Variation amount cannot be negative."),

    body("upSellItems")
        .optional()
        .isArray()
        .withMessage("UpSell items must be an array."),

    body("upSellItems.*.itemId")
        .optional()
        .isMongoId()
        .withMessage("Invalid UpSell item ID."),

    body("upSellItems.*.title")
        .optional()
        .isString()
        .withMessage("UpSell item title must be a string."),

    body("upSellItems.*.shortDescription")
        .optional()
        .isString()
        .withMessage("UpSell item short description must be a string."),

    body("upSellItems.*.featureImage")
        .optional()
        .isString()
        .withMessage("UpSell item feature image must be a string."),

    body("crossSellItems")
        .optional()
        .isArray()
        .withMessage("CrossSell items must be an array."),

    body("crossSellItems.*.itemId")
        .optional()
        .isMongoId()
        .withMessage("Invalid CrossSell item ID."),

    body("crossSellItems.*.title")
        .optional()
        .isString()
        .withMessage("CrossSell item title must be a string."),

    body("crossSellItems.*.shortDescription")
        .optional()
        .isString()
        .withMessage("CrossSell item short description must be a string."),

    body("crossSellItems.*.featureImage")
        .optional()
        .isString()
        .withMessage("CrossSell item feature image must be a string."),

    body("honeypot")
        .custom((value) => {
        if (value) {
            throw new Error("Spam detektovan.");
        }
        return true;
        })
], isAuth, isAdmin, ItemController.postAddItem);

router.post("/artikal-izmena", [
    body("title")
        .optional()
        .notEmpty()
        .withMessage("Title is required.")
        .isString()
        .withMessage("Title must be a string."),

    body("sku")
        .optional()
        .notEmpty()
        .withMessage("SKU is required.")
        .isString()
        .withMessage("SKU must be a string."),

    body("shortDescription")
        .optional()
        .notEmpty()
        .withMessage("Short description is required.")
        .isString()
        .withMessage("Short description must be a string."),

    body("keyWords")
        .optional()
        .isArray({ min: 1 })
        .withMessage("KeyWords must be an array with at least one value.")
        .custom((keyWords) => keyWords.every((key) => typeof key === "string"))
        .withMessage("All KeyWords must be strings."),

    body("description")
        .optional()
        .notEmpty()
        .withMessage("Description is required.")
        .isString()
        .withMessage("Description must be a string."),

    body("featureImage.img")
        .optional()
        .notEmpty()
        .withMessage("Feature image is required if provided."),

    body("featureImage.imgDesc")
        .optional()
        .notEmpty()
        .withMessage("Feature image description is required if provided."),

    body("categories")
        .optional()
        .isArray({ min: 1 })
        .withMessage("Categories must be an array with at least one value.")
        .custom((categories) => categories.every((cat) => typeof cat === "string"))
        .withMessage("All categories must be strings."),

    body("tags")
        .optional()
        .isArray({ min: 1 })
        .withMessage("Tags must be an array with at least one value.")
        .custom((tags) => tags.every((tag) => typeof tag === "string"))
        .withMessage("All tags must be strings."),

    body("status")
        .optional()
        .isArray({ min: 1 })
        .withMessage("Status must be an array with at least one value.")
        .custom((status) => status.every((stat) => ["action", "featured", "empty", "normal", "partnership"].includes(stat)))
        .withMessage("Invalid status value."),

    body("price")
        .optional()
        .notEmpty()
        .withMessage("Price is required.")
        .isNumeric()
        .withMessage("Price must be a number.")
        .isFloat({ min: 100 })
        .withMessage("Price must be at least 100."),

    body("actionPrice")
        .optional()
        .notEmpty()
        .withMessage("Action price is required.")
        .isNumeric()
        .withMessage("Action price must be a number.")
        .isFloat({ min: 100 })
        .withMessage("Action price must be at least 100."),

    body("variations")
        .optional()
        .isArray()
        .withMessage("Variations must be an array.")
        .custom((variations) =>
            variations.every((variation) =>
                ["size", "color", "amount", "imgDesc"].every((field) => field in variation)
            )
        )
        .withMessage("All variations must have size, color, amount, and image description."),

    body("variations.*.size")
        .optional()
        .isString()
        .withMessage("Variation size must be a string.")
        .isIn(["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "S/M", "M/L", "L/XL", "XL/2XL", "Uni"])
        .withMessage("Invalid variation size."),

    body("variations.*.color")
        .optional()
        .isString()
        .withMessage("Variation color must be a string."),

    body("variations.*.amount")
        .optional()
        .isNumeric()
        .withMessage("Variation amount must be a number.")
        .isInt({ min: 0 })
        .withMessage("Variation amount cannot be negative."),

    body("variations.*.imgDesc")
        .optional()
        .notEmpty()
        .withMessage("Variation image description is required if provided."),

    body("upSellItems")
        .optional()
        .isArray()
        .withMessage("UpSell items must be an array."),

    body("upSellItems.*.itemId")
        .optional()
        .isMongoId()
        .withMessage("Invalid UpSell item ID."),

    body("upSellItems.*.title")
        .optional()
        .isString()
        .withMessage("UpSell item title must be a string."),

    body("upSellItems.*.shortDescription")
        .optional()
        .isString()
        .withMessage("UpSell item short description must be a string."),

    body("upSellItems.*.featureImage")
        .optional()
        .isString()
        .withMessage("UpSell item feature image must be a string."),

    body("crossSellItems")
        .optional()
        .isArray()
        .withMessage("CrossSell items must be an array."),

    body("crossSellItems.*.itemId")
        .optional()
        .isMongoId()
        .withMessage("Invalid CrossSell item ID."),

    body("crossSellItems.*.title")
        .optional()
        .isString()
        .withMessage("CrossSell item title must be a string."),

    body("crossSellItems.*.shortDescription")
        .optional()
        .isString()
        .withMessage("CrossSell item short description must be a string."),

    body("crossSellItems.*.featureImage")
        .optional()
        .isString()
        .withMessage("CrossSell item feature image must be a string."),
    
    body("honeypot")
        .custom((value) => {
        if (value) {
            throw new Error("Spam detektovan.");
        }
        return true;
        })
], isAuth, isAdmin, ItemController.postEditItem);

router.post("/artikli/pretraga", [
    body("honeypot")
        .custom((value) => {
        if (value) {
            throw new Error("Spam detektovan.");
        }
        return true;
        })
], isAuth, isAdmin, ItemController.postSearchItems);

router.post("/kontakti/pretraga", [
    body("honeypot")
        .custom((value) => {
        if (value) {
            throw new Error("Spam detektovan.");
        }
        return true;
        })
], isAuth, isAdmin, ContactController.postSearchContact);

router.post('/kupon-dodavanje',[
    body('code')
    .trim()
    .notEmpty()
    .withMessage('Kod je obavezan.'),

    body('status')
    .isArray({ min: 1 })
    .withMessage('Morate izabrati bar jedan status.'),

    body('discount')
    .notEmpty()
    .withMessage('Popust je obavezan.')
    .bail()
    .isFloat({ min: 5, max: 100 })
    .withMessage('Popust mora biti između 5 i 100.'),

    body('amount')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Količina mora biti broj veći ili jednako 0.'),

    body('startDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Datum početka nije validan.'),

    body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Datum završetka nije validan.'),

    body('couponId')
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage('Kupon ID nije validan.'),

    body("honeypot")
        .custom((value) => {
        if (value) {
            throw new Error("Spam detektovan.");
        }
        return true;
        })
], isAuth, isAdmin, CouponController.postNewCoupon);


router.post('/porudzbine/pretraga', [], isAuth, isAdmin, OrderController.postOrderSearch);

router.delete('/izbrisite-kupon', isAuth, isAdmin, CouponController.deleteCouponById);

export default router;