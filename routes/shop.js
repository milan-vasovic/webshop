import { Router } from "express";
import { body } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import sanitize from 'mongo-sanitize';

import {
  cartLimiter,
  searchLimiter
} from '../middleware/rateLimiter.js';


import ShopController from '../controller/shopController.js';

const router = Router();

router.get("", ShopController.getShopPage);

router.get("/pretraga/:search", ShopController.getShopPageBySearch);

router.get("/kategorija/:category", ShopController.getShopPageByCategory);

router.get("/oznaka/:tag", ShopController.getShopPageByTag);

router.get('/istaknuto', ShopController.getFeautredShopPage);

router.get('/akcija', ShopController.getActionedShopPage);

router.get("/artikal/:itemSlug", ShopController.getItemBySlug);

router.get('/korpa', ShopController.getCartPage);

router.get('/porudzbina', ShopController.getCheckOutPage);

router.get('/potvrdite-porudzbinu', ShopController.getConfirmOrder)

router.post("/pretraga", searchLimiter, ShopController.postShopSearch);

router.post('/backorder-dodavanje', ShopController.postAddItemToBackorder);

router.post('/korpa-dodavanje', cartLimiter, [
  // Item ID
  body('itemId')
    .exists().withMessage('Item ID je obavezan.')
    .customSanitizer((value) => sanitizeHtml(sanitize(value)))
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Nevažeći ID artikla.');
      }
      return true;
    }),

  // Variation ID
  body('variationId')
    .exists().withMessage('Variation ID je obavezan.')
    .customSanitizer((value) => sanitizeHtml(sanitize(value)))
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Nevažeći ID varijacije.');
      }
      return true;
    }),

  // Amount
  body('amount')
    .exists().withMessage('Količina je obavezna.')
    .isInt({ min: 1, max: 50 }).withMessage('Količina mora biti broj između 1 i 50.')
    .toInt(),

  // Honeypot
  body('honeypot')
    .custom((value) => {
      if (value && value.trim() !== '') {
        throw new Error('Sumnjiv pokušaj – honeypot polje nije prazno.');
      }
      return true;
    })
], ShopController.postAddItemToCart);

router.post("/provera-kupona", ShopController.postCouponValidation);

router.post("/porucivanje", [
    // First Name: required, trimmed, letters only
    body('firstName')
      .trim()
      .notEmpty().withMessage('First name is required.')
      .matches(/^[\p{L}\s-]+$/u).withMessage('First name can only contain letters.'),
  
    // Last Name: required, trimmed, letters only
    body('lastName')
      .trim()
      .notEmpty().withMessage('Last name is required.')
      .matches(/^[\p{L}\s-]+$/u).withMessage('Last name can only contain letters.'),
  
    // Email: required and must be valid
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Email must be valid.'),
  
    // Telephone: if not using a new telephone, the field must be filled and valid
    body('telephone')
      .if((value, { req }) => !req.body.isNewTelephone)
      .trim()
      .notEmpty().withMessage('Telephone number is required.')
      .isMobilePhone('any').withMessage('Telephone number must be valid.'),
  
    // New Telephone: if the flag isNewTelephone is set, then newTelephone is required and must be valid
    body('newTelephone')
      .if((value, { req }) => req.body.isNewTelephone)
      .trim()
      .notEmpty().withMessage('New telephone number is required.')
      .isMobilePhone('any').withMessage('New telephone number must be valid.'),
  
    // Address: optional if a predefined address is selected
    body('address')
      .optional({ checkFalsy: true })
      .trim(),
  
    // New Address: if flag isNewAddress is set, then newCity, newStreet, and newAddressNumber are required
    body('newCity')
      .if((value, { req }) => req.body.isNewAddress)
      .trim()
      .notEmpty().withMessage('City is required.'),
    body('newStreet')
      .if((value, { req }) => req.body.isNewAddress)
      .trim()
      .notEmpty().withMessage('Street is required.'),
    body('newAddressNumber')
      .if((value, { req }) => req.body.isNewAddress)
      .trim()
      .notEmpty().withMessage('House number is required.'),
    body('newPostalCode')
      .if((value, { req }) => req.body.isNewAddress)
      .optional({ checkFalsy: true })
      .trim()
      .isPostalCode('any').withMessage('Postal code must be valid.'),
  
    // If no predefined address is used, validate the address fields from the form
    body('newCity')
      .if((value, { req }) => !req.body.address)
      .trim()
      .notEmpty().withMessage('City is required.'),
    body('newStreet')
      .if((value, { req }) => !req.body.address)
      .trim()
      .notEmpty().withMessage('Street is required.'),
    body('newAddressNumber')
      .if((value, { req }) => !req.body.address)
      .trim()
      .notEmpty().withMessage('House number is required.'),
    body('newPostalCode')
      .if((value, { req }) => !req.body.address)
      .optional({ checkFalsy: true })
      .trim()
      .isPostalCode('any').withMessage('Postal code must be valid.'),
  
    // Acceptance: must be checked (if checkbox is not checked, the value is undefined)
    body('acceptance')
      .custom((value) => {
        if (!value) {
          throw new Error('You must accept the Terms of Use and Privacy Policy.');
        }
        return true;
      }),
  
    body('createAccount')
      .optional({ checkFalsy: true })
      .custom(value => true),

    // CouponId: optional, but if provided, must have at least 3 characters and only valid characters
    body('couponId')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 3 }).withMessage('Coupon code must have at least 3 characters.')
      .matches(/^[\p{L}\d\s-]+$/u).withMessage('Coupon code contains invalid characters.'),
  
    // Note: optional field, trim any whitespace
    body('note')
      .optional({ checkFalsy: true })
      .trim(),
  
    // Honeypot: must be empty
    body('honeypot')
      .custom((value) => {
        if (value && value.trim() !== '') {
          throw new Error('Invalid request.');
        }
        return true;
      }),
  
    // CSRFToken: must be present
    body('CSRFToken')
      .trim()
      .notEmpty().withMessage('CSRF token is required.')
  ], ShopController.postTemporaryOrder);
  

router.post('/potvrdite-porudzbinu', ShopController.postConfirmOrder);

router.post("/korpa-praznjenje", ShopController.postRemoveItemsFromCart);

router.delete('/korpa-izbacivanje', ShopController.postRemoveItemFromCart);

export default router;