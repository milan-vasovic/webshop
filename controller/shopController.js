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

        const userId = req.session.user?._id;

        let isWishlisted = false;
        if (userId) {
            isWishlisted = item["Lista Želja"].some(wish => wish.userId.toString() === userId.toString());
        }

        return res.render('shop/item', {
            path: '/item',
            pageTitle: item.Naziv.value,
            pageDescription: item["Kratak Opis"].value,
            pageKeyWords: item["Ključne Reči"].value,
            item: item,
            isWishlisted
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
            path: "/prodavnica/korpa",
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
            token: token
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

        await UserService.removeItemFromCart(userId, cartItemId);

        res.redirect('/prodavnica/korpa');
    } catch (error) {
        next(error);
    }
}

async function postRemoveItemsFromCart(req, res, next) {
    try {
        if(!req.session.user) {
            req.session.cart = [];

            return res.redirect('/prodavnica/korpa');
        }

        const userId = req.session.user._id;

        await UserService.removeItemsFromCart(userId);

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
            message: message
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
                    const newUser = await UserService.registerNewUser(tempOrder.email,"PodrazumevanaSifra123!", tempOrder.buyer.firstName, tempOrder.buyer.lastName, newTelephoneUser, newAddressUser, session);
                    if (newUser) {
                        const newOrder = await OrderService.createNewOrder(
                            { type: 'User', ref: newUser._id, firstName: tempOrder.buyer.firstName, lastName: tempOrder.buyer.lastName },
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
            message: message
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
    getItemByName,
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