import sanitizeHtml from 'sanitize-html';
import sanitize from 'mongo-sanitize';
import mongoose from 'mongoose';
import {validationResult} from 'express-validator';
import { generateBreadcrumbJsonLd } from "../helper/breadcrumbsSchema.js";
import { buildBreadcrumbs } from "../helper/buildBreadcrumbs.js";

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

        const breadcrumbs = buildBreadcrumbs({
            type: "item"
          });

        return res.render("shop/shop", {
            path: "/prodavnica",
            pageTitle: "Prodavnica - TopHelanke Online Kupovina",
            pageDescription: "Pregledajte našu prodavnicu sa najnovijim modelima helanki, sportske odeće i dodataka. Sigurna i brza online kupovina iz udobnosti vašeg doma.",
            pageKeyWords: "prodavnica, helanke, sportska odeća, ženska odeća, online prodaja, TopHelanke, kupovina, sigurna kupovina, moda, novi modeli",
            featureImage: undefined,
            index: true,
            shop: shop,
            breadcrumbs,
            breadcrumbJsonLd: JSON.stringify(generateBreadcrumbJsonLd(breadcrumbs))
          });          

    } catch (error) {
        next(error);
    }
}

async function getShopPageByCategory(req, res, next) {
    try {
        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 9;
        const category = req.params.category ? sanitizeHtml(sanitize(req.params.category)) : "";

        const shop = await ShopService.findItemsByCategory(category, page, limit);
        const totalPages = Math.ceil(shop.Ukupno / limit);

        const breadcrumbs = buildBreadcrumbs({
            mode: "category",
            category: category,
            type: "item"
          });

        return res.render("shop/shop", {
            path: `/prodavnica/kategorija/${category}`,
            pageTitle: `Prodavnica - Kategorija: ${category}`,
            pageDescription: `Istražite proizvode u kategoriji "${category}" u našoj online prodavnici. Kvalitetna ponuda helanki, sportske odeće i dodataka po pristupačnim cenama.`,
            pageKeyWords: `${category}, helanke, sportska odeća, prodavnica, TopHelanke, online kupovina, sigurna kupovina, ženska odeća, ${category} modeli`,
            featureImage: undefined,
            index: true,
            shop: shop,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/prodavnica/kategorija/${category}`,
            breadcrumbs,
            breadcrumbJsonLd: JSON.stringify(generateBreadcrumbJsonLd(breadcrumbs))
        })

    } catch (error) {
        next(error);
    }
}

async function getShopPageByTag(req, res, next) {
    try {
        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 9;
        const tag = req.params.tag ? sanitizeHtml(sanitize(req.params.tag)) : "";

        const shop = await ShopService.findItemsByTags(tag, page, limit);
        const totalPages = Math.ceil(shop.Ukupno / limit);

        const breadcrumbs = buildBreadcrumbs({
            mode: "tag",
            tag: tag,
            type: "item"
        });

        return res.render("shop/shop", {
            path: `/prodavnica/oznaka/${tag}`,
            pageTitle: `Prodavnica - Oznaka: ${tag}`,
            pageDescription: `Pregledajte proizvode označene sa "${tag}" u našoj online prodavnici. Otkrijte najtraženije artikle u kategoriji helanki i sportske odeće.`,
            pageKeyWords: `${tag}, helanke, sportska odeća, online kupovina, oznaka, popularno, akcija, TopHelanke`,
            featureImage: undefined,
            index: true,
            shop: shop,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/prodavnica/oznaka/${tag}`,
            breadcrumbs,
            breadcrumbJsonLd: JSON.stringify(generateBreadcrumbJsonLd(breadcrumbs))
          });
    } catch (error) {
        next(error);
    }
}

async function getShopPageBySearch(req, res, next) {
    try {
        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 9;
        const search = req.params.search ? sanitizeHtml(sanitize(req.params.search )): "";

        const param = sanitize(search)
        const shop = await ShopService.findItemsBySearch(param, page, limit);
        const totalPages = Math.ceil(shop.Ukupno / limit);

        const breadcrumbs = buildBreadcrumbs({
            mode: "search",
            search: search,
            type: "item"
        });

        return res.render("shop/shop", {
            path: `/prodavnica/pretraga/${param}`,
            pageTitle: `Rezultati pretrage za: ${search}`,
            pageDescription: `Pronađite proizvode koji odgovaraju pojmu "${search}" u našoj prodavnici. Istražite bogatu ponudu helanki i sportske odeće.`,
            pageKeyWords: `${search}, helanke, odeća, sportska oprema, TopHelanke, online kupovina, pretraga`,
            featureImage: undefined,
            index: true,
            shop: shop,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/prodavnica/pretraga/${param}`,
            breadcrumbs,
            breadcrumbJsonLd: JSON.stringify(generateBreadcrumbJsonLd(breadcrumbs))
          });          

    } catch (error) {
        next(error);
    }
}

async function getFeautredShopPage(req, res, next) {
    try {
        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 9;
        const shop = await ShopService.findFeaturedItems(page, limit);
        const totalPages = Math.ceil(shop.Ukupno / limit);
     
        const breadcrumbs = buildBreadcrumbs({
            mode: "featured",
            type: "item"
          });

        return res.render("shop/shop", {
            path: "/prodavnica/istaknuto",
            pageTitle: "Istaknuti Proizvodi – Prodavnica",
            pageDescription: "Pogledajte naše najtraženije i najprodavanije proizvode. Izaberite između pažljivo odabranih artikala iz naše ponude helanki i sportske odeće.",
            pageKeyWords: "istaknuto, popularno, top proizvodi, helanke, odeća, prodaja, webshop, TopHelanke",
            index: true,
            featureImage: undefined,
            shop: shop,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/prodavnica/istaknuto`,
            breadcrumbs,
            breadcrumbJsonLd: JSON.stringify(generateBreadcrumbJsonLd(breadcrumbs))
          });
          
    } catch (error) {
        next(error);
    }
}

async function getActionedShopPage(req, res, next) {
    try {
        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 9;
        const shop = await ShopService.findActionedItems(page, limit);
        const totalPages = Math.ceil(shop.Ukupno / limit);

        const breadcrumbs = buildBreadcrumbs({
            mode: "action",
            
            type: "item"
        });

        return res.render("shop/shop", {
            path: "/prodavnica/akcija",
            pageTitle: "Akcija – Popusti i Sniženja | Prodavnica",
            pageDescription: "Iskoristite najbolje popuste i sniženja u našoj prodavnici. Ograničena ponuda helanki i sportske odeće po sniženim cenama.",
            pageKeyWords: "akcija, popusti, sniženje, helanke, sport, odeća, webshop, TopHelanke",
            index: true,
            featureImage: undefined,
            shop: shop,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/prodavnica/akcija`,
            breadcrumbs,
            breadcrumbJsonLd: JSON.stringify(generateBreadcrumbJsonLd(breadcrumbs))
          });
    } catch (error) {
        next(error);
    }
}

async function getItemBySlug(req, res, next) {
    try {
        const itemSlug = sanitizeHtml(sanitize(req.params.itemSlug));

        const item = await ShopService.findItemBySlug(itemSlug);

        const userId = req.session.user?._id;

        let isWishlisted = false;
        if (userId) {
            isWishlisted = item["Lista Želja"].some(wish => wish.userId.toString() === userId.toString());
        }

        const breadcrumbs = buildBreadcrumbs({
            item: item,
            type: "item"
        });

        return res.render('shop/item', {
            path: `/prodavnica/artikal/${item.Naziv.value}`,
            pageTitle: `${item.Naziv.value} | TopHelanke`,
            pageDescription: item["Kratak Opis"]?.value || 'Detaljan prikaz proizvoda iz naše ponude.',
            pageKeyWords: item["Ključne Reči"]?.value || 'helanke, sport, odeća, prodavnica',
            featureImage: item.Slike["Istaknuta Slika"].URL || undefined,
            index: true,
            item,
            isWishlisted,
            breadcrumbs,
            breadcrumbJsonLd: JSON.stringify(generateBreadcrumbJsonLd(breadcrumbs))
          });
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
            path: "/prodavnica/korpa",
            pageTitle: "Vaša Korpa",
            pageDescription: "Svi Vaši izabrani artikli na jednom mestu, prikaz vaše korpe!",
            pageKeyWords: "Korpa, Vaši Artikli, Online Kupovina",
            cart: cart,
            index: false,
            featureImage: undefined,
          });
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
                pageDescription: "Poručite, napravite vašu porudžbinu brzo i lako.",
                pageKeyWords: "Poručivanje, Brzo, Lako, Jednostavno, Kupovina, Webshop",
                cart: cart,
                userInfo: userInfo,
                errorMessage: "",
                shipping: process.env.SHIPPING_PRICE,
                index: false,
                featureImage: undefined,
            });     
        }

        return res.render("shop/checkout", {
            path: "/poručivanje",
            pageTitle: "Poručite",
            pageDescription: "Poručite, napravite vašu porudžbinu brzo i lako",
            pageKeyWords: "Poručivanje, Brzo, Lako, Jednostavno",
            cart: sessionCart,
            userInfo: undefined,
            errorMessage:"",
            shipping: process.env.SHIPPING_PRICE,
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}

async function getConfirmOrder(req, res, next) {
    try {
        const { token } = req.query;

        let existingData = req.existingData;

        if (!existingData) {
            existingData = ""
        }

        return res.render("shop/order-confirm", {
            path: "/prodavnica/potvrdite-porudzbinu",
            pageTitle: "Potvrdite Porudžbinu",
            pageDescription: "Potvrđivanje Porudžbine",
            pageKeyWords: "",
            existingData: existingData,
            errorMessage: "",
            token: token,
            index: false,
            featureImage: undefined,
        });
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
            req.session.cartItemCount = req.session.cart.length || 0;
            return res.redirect('/prodavnica')
        }

        const userId = req.session.user._id;
        await UserService.addItemToUserCart(userId, itemForCart);
        req.session.user.cart.push(itemForCart);
        req.session.cartItemCount = req.session.user.cart.length || 0;
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
                req.session.cartItemCount = req.session.cart.length || 0;
            }

            return res.redirect('/prodavnica/korpa');
        }

        const userId = req.session.user._id;

        await UserService.removeItemFromCart(userId, cartItemId);
        req.session.user.cart = req.session.user.cart.filter(item => item.itemId.toString() !== cartItemId.toString());
        req.session.cartItemCount = req.session.user.cart.length || 0;

        res.redirect('/prodavnica/korpa');
    } catch (error) {
        next(error);
    }
}

async function postRemoveItemsFromCart(req, res, next) {
    try {
        if(!req.session.user) {
            req.session.cart = [];
            req.session.cartItemCount = 0;
            return res.redirect('/prodavnica/korpa');
        }

        const userId = req.session.user._id;

        await UserService.removeItemsFromCart(userId);
        req.session.user.cart = [];
        req.session.cartItemCount = req.session.user.cart.length || 0;
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

async function postTemporaryOrder(req, res, next) {
    // Start a new MongoDB session for transaction handling
    const session = await mongoose.startSession();
    try {
        let message;
        session.startTransaction();
        const userId = req.session.user?._id; // Retrieve user ID if logged in

        // Sanitize and extract user input
        const firstName = sanitize(req.body.firstName);
        const lastName = sanitize(req.body.lastName);
        const email = sanitize(req.body.email);
        const hasNewTelephone = sanitize(req.body.isNewTelephone);
        const hasNewAddress = sanitize(req.body.isNewAddress);
        const couponId = sanitize(req.body.couponId);
        const note = sanitizeHtml(req.body.note) || "";
        const createNewAccount = sanitize(req.body.createAccount) || false;
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
                shipping: process.env.SHIPPING_PRICE,
                index: false,
                featureImage: undefined,
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
                    shipping: process.env.SHIPPING_PRICE,
                    index: false,
                    featureImage: undefined,
                })            
            }
        }

        let newTemporaryOrder;
        // Process order creation
        if (userId) {
            newTemporaryOrder = await OrderService.createNewTemporaryOrder(
                { type: 'User', firstName: firstName, lastName: lastName },
                email,
                telephone,
                address,
                cart,
                totalPrice,
                note,
                session,
                { couponId: coupon?._id, code: coupon?.code, discount: coupon?.discount },
                hasNewTelephone,
                hasNewAddress

            )

            message = "Hvala Vam, uspešno ste napravili porudžbinu, proverite vaš email i POTVRDITE istu. Sve inforamcije možete pronaći prijavom na vaš nalog vezano za porudžbinu!"
        } else {
            newTemporaryOrder = await OrderService.createNewTemporaryOrder(
                { type: 'Customer', firstName: firstName, lastName: lastName },
                email,
                telephone,
                address,
                cart,
                totalPrice,
                note,
                session,
                { couponId: coupon?._id, code: coupon?.code, discount: coupon?.discount },
                createNewAccount,
                hasNewTelephone,
                hasNewAddress
            )

            message = "Hvala Vam, uspešno ste napravili porudžbinu, proverite vaš email i POTVRDITE istu! Ako želite više inforamcija i benefite, registrujte se na našu aplikaciju!"
        }

        // Send order confirmation email (not critical for success)
        const isSent = await EmailService.sendOrderConfirmation(newTemporaryOrder.buyer.firstName, newTemporaryOrder.email, newTemporaryOrder.verificationToken);

        if (!isSent) {
            const error = new Error("Email potvrde nije poslat!");
            next(error);
        }

        // Commit transaction and finalize order
        await session.commitTransaction();
        return res.render("email/success", {
            path: "/uspesno-poruceno",
            pageTitle: "Uspešno Poručivanje",
            pageDescription: "Stranica koja informiše korisnika o uspešnom poručivanju",
            pageKeyWords: "Uspeh, Uspešno, Poručivanje",
            message: message,
            index: false,
            featureImage: undefined,
        })
    } catch (error) {
        console.log(error);
         // Rollback transaction on error
         await session.abortTransaction();
         next(error);
    } finally {
        // Ensure the session is always closed
        session.endSession();
    }
}

async function postConfirmOrder(req, res, next) {
    // Start a new MongoDB session for transaction handling
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        let message;
        const { token } = req.body;
        const userId = req.session.user?._id; // Retrieve user ID if logged in

        const tempOrder = await OrderService.validateTemporaryOrder(token);

        let coupon;
        if (tempOrder.coupon) {
            coupon = tempOrder.coupon
        }

        // This is if user is loogedin
        if (userId) {
            // Create order for registered user
            const newOrder = await OrderService.createNewOrder(
                { type: 'User', ref: userId, firstName: tempOrder.buyer.firstName, lastName: tempOrder.buyer.lastName },
                tempOrder.email,
                tempOrder.telephone,
                tempOrder.address,
                tempOrder.items,
                tempOrder.totalPrice,
                tempOrder.note,
                session,
                coupon,
            )

            if (newOrder) {
                let newTelephoneUser, newAddressUser;
                if (tempOrder.hasNewTelephone) newTelephoneUser = tempOrder.telephone;
                if (tempOrder.hasNewAddress) newAddressUser = tempOrder.address;

                // Update user data after order
                await UserService.updateUserAfterOrder(userId, newOrder, session, newTelephoneUser, newAddressUser);
            }

            message = "Hvala Vam, uspešno ste napravili porudžbinu, proverite vaš email i potvrdite istu. Sve inforamcije možete pronaći prijavom na vaš nalog vezano za porudžbinu!"
        } else {
            // When there isn't loogedin user, its guest
            if (tempOrder.createNewAccount) {
                // When guest wants to creat account
                const hasUserExist = await UserService.findUserByEmail(tempOrder.email);
                if (hasUserExist) {
                    // When guest already have account as user, creating order for him
                    const newOrder = await OrderService.createNewOrder(
                        { type: 'User', ref: hasUserExist._id, firstName: tempOrder.buyer.firstName, lastName: tempOrder.buyer.lastName },
                        tempOrder.email,
                        tempOrder.telephone,
                        tempOrder.address,
                        tempOrder.items,
                        tempOrder.totalPrice,
                        tempOrder.note,
                        session,
                        { couponId: tempOrder.coupon?._id, code: tempOrder.coupon?.code, discount: tempOrder.coupon?.discount },
                    )
        
                    if (newOrder) {
                        // Update user data after order
                        await UserService.updateUserAfterOrder(hasUserExist._id, newOrder, session, tempOrder.telephone, tempOrder.address);
                        req.session.cart = [];
                    }
                    message = "Hvala Vam, uspešno ste napravili porudžbinu. Sve informacije možete videti na vašem nalogu!"
                } else {
                    // Guest doesnt have account in the system
                    let newTelephoneUser, newAddressUser;
                    if (tempOrder.hasNewTelephone) newTelephoneUser = tempOrder.telephone;
                    if (tempOrder.hasNewAddress) newAddressUser = tempOrder.address;
                    const newUser = await UserService.registerNewUser(tempOrder.email, process.env.DEFAULT_PASSWORD, tempOrder.buyer.firstName, tempOrder.buyer.lastName, newTelephoneUser, newAddressUser, session, true);
                    if (newUser) {
                        const newOrder = await OrderService.createNewOrder(
                            { type: 'User', ref: newUser._id, firstName: tempOrder.buyer.firstName, lastName: tempOrder.buyer.lastName },
                            tempOrder.email,
                            tempOrder.telephone,
                            tempOrder.address,
                            tempOrder.items,
                            tempOrder.totalPrice,
                            tempOrder.note,
                            session,
                            { couponId: tempOrder.coupon?._id, code: tempOrder.coupon?.code, discount: tempOrder.coupon?.discount },
                        )
                
                        if (newOrder) {
                            // Update user data after order
                            await UserService.updateUserAfterOrder(newUser._id, newOrder, session);
                        }
                    }
                    message = "Hvala Vam, uspešno ste napravili porudžbinu, proverite vaš email! Uspešno ste se registrovali, da bi ste se prijavili idite na zaboravili ste lozinku za odgovarajući email i zatražite novu, pratite uputstva iz emaila i postavite novu lozinku!"
                }
            } else {
                // Check does guest already have account with us, if yes creat order for him, otherwise creat new customer and order for him
                const hasUserExist = await UserService.findUserByEmail(tempOrder.email);
                if (hasUserExist) {
                    const newOrder = await OrderService.createNewOrder(
                        { type: 'User', ref: hasUserExist._id, firstName: tempOrder.buyer.firstName, lastName: tempOrder.buyer.lastName },
                        tempOrder.email,
                        tempOrder.telephone,
                        tempOrder.address,
                        tempOrder.items,
                        tempOrder.totalPrice,
                        tempOrder.note,
                        session,
                        { couponId: tempOrder.coupon?._id, code: tempOrder.coupon?.code, discount: tempOrder.coupon?.discount },
                    )
        
                    if (newOrder) {
                        // Update user data after order
                        await UserService.updateUserAfterOrder(hasUserExist._id, newOrder, session, tempOrder.telephone, tempOrder.address);
                        req.session.cart = [];
                    }
                    message = "Hvala Vam, uspešno ste napravili porudžbinu. Sve informacije možete videti na vašem nalogu!"
                } else {
                    // Create new customer and process guest order
                    const customer = await CustomerService.registerNewCustomer(tempOrder.buyer.firstName, tempOrder.buyer.lastName, tempOrder.email, tempOrder.telephone, tempOrder.address, session);
                    const buyer = { type: 'Customer', ref: customer._id, firstName: tempOrder.buyer.firstName, lastName: tempOrder.buyer.lastName };

                    // Create order for guest user
                    const newOrder = await OrderService.createNewOrder(
                        buyer,
                        tempOrder.email,
                        tempOrder.telephone,
                        tempOrder.address,
                        tempOrder.items,
                        tempOrder.totalPrice,
                        tempOrder.note,
                        session,
                    )

                    // Link order to customer
                    await CustomerService.updateCustomerOrders(customer._id, newOrder._id, session);

                    // Clear guest cart
                    req.session.cart = [];

                    // Send order confirmation email (not critical for success)
                    EmailService.sendOrderInfo(customer.firstName, customer.email, newOrder);

                    message = "Hvala Vam, uspešno ste napravili porudžbinu, proverite vaš email! Ako želite više inforamcija i benefite, registrujte se na našu aplikaciju!"
                }
            }
        }

        await OrderService.deleteTemporaryOrderById(tempOrder._id, session);

        // Commit transaction and finalize order
        await session.commitTransaction();
        return res.render("email/success", {
            path: "/uspesno-poruceno",
            pageTitle: "Uspešno Poručivanje",
            pageDescription: "Stranica koja informiše korisnika o uspešnom poručivanju",
            pageKeyWords: "Uspeh, Uspešno, Poručivanje",
            message: message,
            index: false,
            featureImage: undefined,
        })
    } catch (error) {
        console.log(error);
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
    getItemBySlug,
    getConfirmOrder,
    postShopSearch,
    postAddItemToCart,
    postAddItemToBackorder,
    postRemoveItemFromCart,
    postRemoveItemsFromCart,
    postCouponValidation,
    postTemporaryOrder,
    postConfirmOrder
}