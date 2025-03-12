import { Router } from "express";
import { body, param, query, validationResult } from 'express-validator'; // Needs to be finished

const router = Router();

import UserController from '../controller/userController.js';
import ItemController from '../controller/itemController.js';

import isAuth from '../middleware/isAuth.js';

router.get("/moj-profil", isAuth, UserController.getMyProfilePage);

router.get("/moja-prodavnica", isAuth, UserController.getMyShopPage);

router.get("/korisnik/porudzbina-detalji/:itemId", UserController.getUserOrderDetails);

router.post('/korisnik/dodajte-broj', [

], isAuth, UserController.postAddNumber);

router.post('/korisnik/dodajte-adresu', [

], isAuth, UserController.postAddAddress);

router.post('/korisnik/dodavanje-u-listu-zelja', ItemController.postAddUserToItemWishlist)

router.post('/korisnik/izbacivanje-iz-liste-zelja', ItemController.postRemoveUserToItemWishlist)

router.post('/korisnik/otkazivanje-porudzbine', isAuth, UserController.postCancelOrder)

router.delete('/korisnik/izbrisite-broj', isAuth, UserController.deleteNumber);

router.delete('/korisnik/izbrisite-adresu', isAuth, UserController.deleteAdressById);

export default router;