import sanitizeHtml from 'sanitize-html';
import sanitize from 'mongo-sanitize';
import mongoose from 'mongoose';
import {validationResult} from 'express-validator';

import ShopService from "../service/shopService.js";
import ItemService from "../service/itemService.js";
import UserService from "../service/userService.js";
import CouponService from "../service/couponService.js";
import CustomerService from "../service/customerService.js";
import OrderService from "../service/orderService.js";
import EmailService from "../service/emailService.js";

async function getShopPage(req, res, next) {
    try {
        const shop = await ShopService.findItemsForShop();

        return res.render("shop/shop", {
            path: "/prodavnica",
            pageTitle: "Prodavnica",
            shop: shop,
        })

    } catch (error) {
        next(error);
    }
}

async function getShopPageByCategory(req, res, next) {
    try {
        const category = req.params.category ? req.params.category : "";

        const shop = await ShopService.findItemsByCategory(category);

        return res.render("shop/shop", {
            path: "/prodavnica",
            pageTitle: `Prodavnica: ${category}`,
            shop: shop,
        })

    } catch (error) {
        next(error);
    }
}

async function getShopPageByTag(req, res, next) {
    try {
        const tag = req.params.tag ? req.params.tag : "";

        const shop = await ShopService.findItemsByTags(tag);

        return res.render("shop/shop", {
            path: "/prodavnica",
            pageTitle: `Prodavnica ${tag}`,
            shop: shop,
        })

    } catch (error) {
        next(error);
    }
}

async function getShopPageBySearch(req, res, next) {
    try {
        const search = req.params.search ? req.params.search : "";

        const param = sanitize(search)
        const shop = await ShopService.findItemsBySearch(param);
        return res.render("shop/shop", {
            path: "/prodavnica",
            pageTitle: `Prodavnica ${search}`,
            shop: shop,
        })

    } catch (error) {
        next(error);
    }
}

async function getFeautredShopPage(req, res, next) {
    try {
        const shop = await ShopService.findFeaturedItems();

        return res.render("shop/shop", {
            path: "/prodavnica",
            pageTitle: "Prodavnica",
            shop: shop,
        })
    } catch (error) {
        next(error);
    }
}

async function getActionedShopPage(req, res, next) {
    try {
        const shop = await ShopService.findActionedItems();

        return res.render("shop/shop", {
            path: "/prodavnica",
            pageTitle: "Prodavnica",
            shop: shop,
        })

    } catch (error) {
        next(error);
    }
}

async function getItemByName(req, res, next) {
    try {
        const itemName = req.params.itemName;

        const item = await ShopService.findItemByName(itemName);

        return res.render('shop/item', {
            path: '/item',
            pageTitle: item.Naziv.value,
            pageDescription: item["Kratak Opis"].value,
            pageKeyWords: item["Ključne Reči"].value,
            item: item
        })
    } catch (error) {
        next(error)
    }
}

async function getCartPage(req, res, next) {
    try {
        let cart;
        if (!req.session.user) {
            cart = req.session.cart;

            cart = cart.map((item) => ({
                ID : { value: item._id },
                'Variacija ID': { value: item.variationId },
                Slika: { value: item.itemImg },
                Artikal: { value: item.itemName },
                Veličina: { value: item.size },
                Boja: { value: item.color },
                Količina: { value: item.amount },
                Cena: { value: item.price },
                Kod: { value: item.code || "Nema Koda"}
            }))
        } else {
            cart = await UserService.findUserCart(req.session.user._id);
        }


        return res.render('shop/cart', {
            path: "/korpa",
            pageTitle: "Vaša Korpa",
            pageDescription: "Svi Vaši izabrani artikli na jednom mestu, prikaz vaše krope!",
            pageKeyWords: "Korpa, Vaši Atikli",
            cart: cart
        })
    } catch (error) {
        next(error);
    }
}

async function getCheckOutPage(req, res, next) {
    try {
        const userId = req.session.user?._id;
        const sessionCart = req.session.cart.map((item) => ({
            ID : { value: item.itemId },
            Slika: { value: item.itemImg },
            'Variacija ID' : { value : item.variationId },
            Artikal: { value: item.itemName },
            Veličina: { value: item.size },
            Boja: { value: item.color },
            Količina: { value: item.amount },
            Cena: { value: item.price },
            Kod: { value: item.code || "Nema Koda"}
        }));

        if (userId) {
            const cart = await UserService.findUserCart(userId);

            const userInfo = await UserService.findUserInfoById(userId);
            
            return res.render("shop/checkout", {
                path: "/poručivanje",
                pageTitle: "Poručite",
                pageDescription: "Poručite, napravite vašu porudžbinu brzo i lako",
                pageKeyWords: "Poručivanje, Brzo, Lako, Jednostavno",
                cart: cart,
                userInfo: userInfo,
                errorMessage: "",
                shipping: process.env.SHIPPING_PRICE
            })
        }

        return res.render("shop/checkout", {
            path: "/poručivanje",
            pageTitle: "Poručite",
            pageDescription: "Poručite, napravite vašu porudžbinu brzo i lako",
            pageKeyWords: "Poručivanje, Brzo, Lako, Jednostavno",
            cart: sessionCart,
            userInfo: undefined,
            errorMessage:"",
            shipping: process.env.SHIPPING_PRICE
        })

    } catch (error) {
        next(error);
    }
}

async function postShopSearch(req, res, next) {
    try {
        const body = req.body.search;

        if (!body) {
            return res.redirect('/prodavnica')
        }

        const search = sanitizeHtml(body);
        return res.redirect(`/prodavnica/pretraga/${search}`);
    } catch (error) {
        next(error);
    }
}

async function postAddItemToCart(req, res, next) {
    try {
        const isUserLoggedIn = req.session.isLoggedIn;
        const itemId = sanitize(req.body.itemId);
        const variationId = sanitize(req.body.variationId);
        const amount = sanitize(req.body.amount);

        const itemForCart = await ItemService.findItemForCart(itemId, variationId, amount);
        
        if (!isUserLoggedIn) {
            if (!req.session.cart) {
                req.session.cart = [];
            }
            req.session.cart.push(itemForCart);

            return res.redirect('/prodavnica')
        }

        const userId = req.session.user._id;
        const isAdded = await UserService.addItemToUserCart(userId, itemForCart);

        return res.redirect('/prodavnica');
    } catch (error) {
        next(error);
    }
}

async function postAddItemToBackorder(req, res, next) {
    try {
        const itemId = sanitize(req.body.itemId);
        const variationId = sanitize(req.body.variationId);
        const amount = sanitize(req.body.amount);
    
        const userId = req.session.user?._id;

        const isAdded = await ItemService.addBackorderToItem(itemId, variationId, amount, userId);

        return res.redirect('/prodavnica');
    } catch (error) {
        next(error);
    }
}

async function postRemoveItemFromCart(req, res, next) {
    try {
        const cartItemId = sanitize(req.body.itemId);

        if(!req.session.user) {
            let cart = req.session.cart || [];

            const index = cart.findIndex(item => item._id.toString() === cartItemId.toString());

            if (index !== -1) {
                cart.splice(index, 1);
                req.session.cart = cart;
            }

            return res.redirect('/prodavnica/korpa');
        }

        const userId = req.session.user._id;

        const isRemoved = await UserService.removeItemFromCart(userId, cartItemId);

        res.redirect('/prodavnica/korpa');
    } catch (error) {
        next(error);
    }
}

async function postCouponValidation(req, res, next) {
    try {
        const coupon = sanitize(req.body.coupon);

        const couponData = await CouponService.validateAndUseCoupon(coupon);

        return res.json({ success: true, couponId: couponData._id ,discount: couponData.discount, message: `Uspešno ste aktivirali kupon: ${couponData.code}!` });
    } catch (error) {
        return res.status(500).json({ success: false, message: error });
    }
}

async function postOrder(req, res, next) {
    // Start a new MongoDB session for transaction handling
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const userId = req.session.user?._id; // Retrieve user ID if logged in

        // Sanitize and extract user input
        const firstName = sanitize(req.body.firstName);
        const lastName = sanitize(req.body.lastName);
        const email = sanitize(req.body.email);
        const hasNewTelephone = sanitize(req.body.isNewTelephone);
        const hasNewAddress = sanitize(req.body.isNewAddress);
        const couponId = sanitize(req.body.couponId);

        // Determine which phone number to use
        let telephone = hasNewTelephone ? sanitize(req.body.newTelephone) : sanitize(req.body.telephone);

        // Determine which address to use
        let address;
        if (hasNewAddress) {
            // User provided a new address
            address = {
                Adresa: {
                    Grad: sanitize(req.body.newCity),
                    Ulica: sanitize(req.body.newStreet),
                    Broj: sanitize(req.body.newAddressNumber),
                    "Poštanski Broj": sanitize(req.body.newPostalCode)
                }
            }
        } else {
            // User selected an existing address
            const addressInput = sanitize(req.body.address);
            const newAddress = addressInput.split(",").map(item => item.trim());
            address = {
                Adresa: {
                    Grad: newAddress[0],
                    Ulica: newAddress[1],
                    Broj: newAddress[2],
                    "Poštanski Broj": newAddress[3]
                }
            }
        }

        // Retrieve user's cart and calculate the total price
        let cart;
        let totalPrice = 0;
        if (userId) {
            // Fetch the cart from the database if the user is logged in
            cart = await UserService.findUserCart(userId);
            cart.forEach(c => {
                totalPrice += c.Cena.value;
            })
        } else {
            // Retrieve the cart from the session for guest users
            cart = req.session.cart.map((item) => ({
                ID : { value: item.itemId },
                "Variacija ID": { value: item.variationId },
                Slika: { value: item.itemImg },
                Artikal: { value: item.itemName },
                Veličina: { value: item.size },
                Boja: { value: item.color },
                Količina: { value: item.amount },
                Cena: { value: item.price },
                Kod: { value: item.code || "Nema Koda"}
            }));
            cart.forEach(c => {
                totalPrice += c.Cena.value;
            })
        }

        // Validate request data using express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("shop/checkout", {
                path: "/poručivanje",
                pageTitle: "Poručite",
                pageDescription: "Poručite, napravite vašu porudžbinu brzo i lako",
                pageKeyWords: "Poručivanje, Brzo, Lako, Jednostavno",
                cart: cart,
                userInfo: {
                    Ime: firstName,
                    Prezime: lastName,
                    Email: email,
                    Telefoni: [{ Broj: telephone }],
                    Adrese: [address]
                },
                errorMessage: errors.array()[0].msg,
                shipping: process.env.SHIPPING_PRICE
            })            
        }

        // Validate and apply coupon (only for logged-in users)
        let coupon;
        if (couponId && userId) {
            coupon = await CouponService.findCouponStatusByIdAndUpdate(couponId, userId, session);

            if (!coupon.status) {
                return res.render("shop/checkout", {
                    path: "/poručivanje",
                    pageTitle: "Poručite",
                    cart: cart,
                    userInfo: {
                        Ime: firstName,
                        Prezime: lastName,
                        Email: email,
                        Telefoni: [{ Broj: telephone }],
                        Adrese: [address]
                    },
                    errorMessage: "Kupon nije Validan! " + coupon.msg,
                    shipping: process.env.SHIPPING_PRICE
                })            
            }
        }

        // Process order creation
        if (userId) {
            // Create order for registered user
            const newOrder = await OrderService.createNewOrder(
                { type: 'User', ref: userId, firstName: firstName, lastName: lastName },
                telephone,
                address,
                cart,
                totalPrice,
                session,
                { couponId: coupon?._id, code: coupon?.code, discount: coupon?.discount },
            )

            if (newOrder) {
                let newTelephoneUser, newAddressUser;
                if (hasNewTelephone) newTelephoneUser = telephone;
                if (hasNewAddress) newAddressUser = address;

                // Update user data after order
                await UserService.updateUserAfterOrder(userId, newOrder, session, newTelephoneUser, newAddressUser);
            }
        } else {
            // Create new customer and process guest order
            const customer = await CustomerService.createNewCustomer(firstName, lastName, email, telephone, address, session);
            const buyer = { type: 'Customer', ref: customer._id, firstName: firstName, lastName: lastName };

            // Create order for guest user
            const newOrder = await OrderService.createNewOrder(
                buyer,
                telephone,
                address,
                cart,
                totalPrice,
                session,
            )

            // Link order to customer
            await CustomerService.updateCustomerOrders(customer._id, newOrder._id, session);

            // Clear guest cart
            req.session.cart = [];

            // Send order confirmation email (not critical for success)
            EmailService.sendOrderInfo(customer.firstName, customer.email, newOrder);
        }

        // Commit transaction and finalize order
        await session.commitTransaction();
        return res.render("email/success", {
            path: "/uspesno-poruceno",
            pageTitle: "Uspešno Poručivanje",
            pageDescription: "Stranica koja informiše korisnika o uspešnom poručivanju",
            pageKeyWords: "Uspeh, Uspešno, Poručivanje",
            message: "Hvala Vam, uspešno ste napravili porudžbinu, proverite vaš email!"
        })
    } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        next(error);
    } finally {
        // Ensure the session is always closed
        session.endSession();
    }
}

export default {
    getShopPage,
    getShopPageByCategory,
    getShopPageByTag,
    getShopPageBySearch,
    getFeautredShopPage,
    getActionedShopPage,
    getCartPage,
    getCheckOutPage,
    getItemByName,
    postShopSearch,
    postAddItemToCart,
    postAddItemToBackorder,
    postRemoveItemFromCart,
    postCouponValidation,
    postOrder
}