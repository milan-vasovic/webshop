import ErrorHelper from '../helper/errorHelper.js';
import ItemService from '../service/itemService.js';
import {validationResult} from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import sanitize from 'mongo-sanitize';

async function getItemsPage(req, res, next) {
    try {
        const search = req.query.search;
        if (search) {
            const filter = {
                $or: [
                    { title: { $regex: search, $options: "i" } },
                    { categories: { $regex: search, $options: "i" } },
                    { tags: { $regex: search, $options: "i" } },
                    { keyWords: { $regex: search, $options: "i" } },
                    { status: { $regex: search, $options: "i" } },
                ],
            };
            const items = await ItemService.findItemsBySearch(filter);

            return res.render("admin/item/items", {
                path: "/admin/artikli",
                pageTitle: "Admin Artikli",
                pageDescription: "Prikaz svih artikala za admina",
                pageKeyWords: "Admin, Artikli, Upravljanje, Dodavanje",
                items: items
            })
        }

        const items = await ItemService.findAdminItems();

        return res.render("admin/item/items", {
            path: "/admin/artikli",
            pageTitle: "Admin Artikli",
            pageDescription: "Prikaz svih artikala za admina",
            pageKeyWords: "Admin, Artikli, Upravljanje, Dodavanje",
            items: items
        })

    } catch (error) {
        next(error);
    }
}

async function getItemDetailsPage(req, res, next) {
    try {
        const itemId = req.params.itemId;

        const item = await ItemService.findItemDetailsByIdForAdmin(itemId);

        return res.render("admin/item/item-details", {
            path: "/admin/artikal-detalji",
            pageTitle: item.Nasolv,
            pageDescription: item['Kratak Opis'],
            pageKeyWords: item['Ključne Reči'],
            item: item
        })
    } catch (error) {
        next(error);
    }
}

async function getAddItemPage(req, res, next) {
    try {
        const allUpsellItems = await ItemService.findAllAdminAddItems("");
        const allCrosselItems = await ItemService.findAllAdminAddItemsByCategory("");

        return res.render("admin/item/add-item", {
            path: "/admin/add-item",
            pageTitle: "Dodajte Artikal",
            editing: false,
            existingData: null,
            errorMessage: "",
            allUpsellItems: allUpsellItems,
            allCrosselItems: allCrosselItems
        })
    } catch (error) {
        next(error);
    }
}

async function getEditItemPage(req, res, next) {
    try {
        const itemId = req.params.itemId;
        const item = await ItemService.findItemDetailsByIdForAdmin(itemId);
        const allUpsellItems = await ItemService.findAllAdminAddItems(item.Kategorije.value, itemId);
        const allCrosselItems = await ItemService.findAllAdminAddItemsByCategory(item.Kategorije.value, itemId);

        return res.render("admin/item/add-item", {
            path: "/admin/add-item",
            pageTitle: "Dodajte Artikal",
            errorMessage: "",
            editing: true,
            existingData: item,
            allUpsellItems: allUpsellItems,
            allCrosselItems: allCrosselItems
        })
    } catch (error) {
        next(error);
    }
}

async function getAllCrosSellItems(req, res, next) {
    try {
        const categories = req.query.categories ? req.query.categories : "";
        const itemId = req.query.itemId ? req.query.itemId : "undefined";
        if (itemId === "undefined") {
            const items = await ItemService.findAllAdminAddItemsByCategory(categories);
            return res.json(items);
        }

        const items = await ItemService.findAllAdminAddItemsByCategory(categories, itemId);

        res.json(items);

    } catch (error) {
        next(error);
    }
}

async function getAllUpSellItems(req, res, next) {
    try {
        const categories = req.query.categories ? req.query.categories : "";
        const itemId = req.query.itemId ? req.query.itemId : "";

        if (itemId === "undefined") {
            const allUpsellItems = await ItemService.findAllAdminAddItems(categories);
            return res.json(allUpsellItems);
        }

        const allUpsellItems = await ItemService.findAllAdminAddItems(categories, itemId);

        return res.json(allUpsellItems);

    } catch (error) {
        next(error);
    }
}

async function postAddItem(req, res, next) {
    try {
        const body = req.body;
        const files = req.files;

        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            const allUpsellItems = await ItemService.findAllAdminAddItems(body.categories, body.itemId);
            const allCrosselItems = await ItemService.findAllAdminAddItemsByCategory(body.categories, body.itemId);

            return res.render("admin/item/add-item", {
                path: "/admin/add-item",
                pageTitle: "Dodajte Artikal",
                errorMessage: errors.array()[0].msg,
                existingData: {
                    Naziv: {value: body.title},
                    SKU: {value:body.sku},
                    'Kratak Opis': {value:body.shortDescription},
                    'Ključne Reči': {value:body.keyWords},
                    Opis: {value:body.description},
                    Cena: {value:body.price},
                    "Akcijska Cena": {value:body.actionPrice},
                    Slike: {
                        'Istaknuta Slika': {
                            Opis: body.featureImageDesc
                        }
                    },
                    Video: {
                        Opis: {value: body.videoDesc}
                    },
                    Kategorije: {value:body.categories},
                    Tagovi: {value:body.tags},
                    Status: {value:body.status},
                    Varijacije: body.variations.map((variation) => ({
                        Veličina: {value:variation.size},
                        Boja: variation.color,
                        Količina: variation.amount,
                        Slika: {
                            Opis: variation.imgDesc,
                        },
                    })),
                    "UpSell Artikli": {value:body.upSellItems},
                    "CrossSell Artikli": {value:body.crossSellItems}
                },
                editing: false,
                allUpsellItems: allUpsellItems,
                allCrosselItems: allCrosselItems
            })
        }

        const newItem = await ItemService.createNewItem(body, files);

        if (!newItem) {
            ErrorHelper.throwConflictError("Nije uspelo");
        }

        return res.redirect('/prodavnica')
    } catch (error) {
        next(error)
    }    
}

async function postEditItem(req, res, next) {
    try {
        // Sanitizacija body i files
        const body = sanitize(req.body); // Zaštita od NoSQL injection
        const files = sanitize(req.files); // Zaštita od NoSQL injection

        // Sanitizacija HTML polja
        body.title = sanitizeHtml(body.title);
        body.sku = sanitizeHtml(body.sku);
        body.shortDescription = sanitizeHtml(body.shortDescription);
        body.description = sanitizeHtml(body.description);
        body.featureImageDesc = sanitizeHtml(body.featureImageDesc);
        body.videoDesc = sanitizeHtml(body.videoDesc);

        // Sanitizacija nizova
        if (body.keyWords) {
            body.keyWords = body.keyWords.map((keyword) => sanitizeHtml(keyword));
        }
        if (body.categories) {
            body.categories = body.categories.map((category) => sanitizeHtml(category));
        }
        if (body.tags) {
            body.tags = body.tags.map((tag) => sanitizeHtml(tag));
        }
        if (body.variations) {
            body.variations = body.variations.map((variation) => ({
                size: sanitizeHtml(variation.size),
                color: sanitizeHtml(variation.color),
                amount: variation.amount, // Broj, nije potrebna sanitizacija
                imgDesc: sanitizeHtml(variation.imgDesc),
            }));
        }

        const itemId = body.itemId;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const allUpsellItems = await ItemService.findAllAdminAddItems(body.categories, itemId);
            const allCrosselItems = await ItemService.findAllAdminAddItemsByCategory(body.categories, itemId);

            return res.render("admin/item/add-item", {
                path: "/admin/add-item",
                pageTitle: "Uredite Artikal",
                errorMessage: errors.array()[0].msg,
                existingData: {
                    ID: itemId,
                    Naziv: { value: body.title },
                    SKU: { value: body.sku },
                    'Kratak Opis': { value: body.shortDescription },
                    'Ključne Reči': { value: body.keyWords },
                    Opis: { value: body.description },
                    Cena: { value: body.price },
                    "Akcijska Cena": { value: body.actionPrice },
                    Slike: {
                        'Istaknuta Slika': {
                            Opis: body.featureImageDesc
                        }
                    },
                    Video: {
                        Opis: { value: body.videoDesc }
                    },
                    Kategorije: { value: body.categories },
                    Tagovi: { value: body.tags },
                    Status: { value: body.status },
                    Varijacije: body.variations.map((variation) => ({
                        Veličina: { value: variation.size },
                        Boja: variation.color,
                        Količina: variation.amount,
                        Slika: {
                            Opis: variation.imgDesc,
                        },
                    })),
                    "UpSell Artikli": { value: body.upSellItems },
                    "CrossSell Artikli": { value: body.crossSellItems }
                },
                editing: true,
                allUpsellItems: allUpsellItems,
                allCrosselItems: allCrosselItems
            });
        }

        // Fetch the existing item from the database
        const existingItem = await ItemService.findItemDetailsByIdForAdmin(itemId);

        if (!existingItem) {
            return ErrorHelper.throwNotFoundError("Artikal nije pronađen");
        }

        // Dobavi potpune podatke za upSellItems i crossSellItems
        if (body.upSellItems) {
            body.upSellItems = await Promise.all(
                body.upSellItems.map(async (itemId) => {
                    const item = await ItemService.findUpCrossSellItems(itemId);
                    return {
                        itemId: item._id,
                        title: item.title,
                        shortDescription: item.shortDescription,
                        featureImage: {img: item.featureImage.img, imgDesc: item.featureImage.imgDesc} // Pretpostavka da je featureImage objekat sa poljem img
                    };
                })
            );
        }

        if (body.crossSellItems) {
            body.crossSellItems = await Promise.all(
                body.crossSellItems.map(async (itemId) => {
                    const item = await ItemService.findUpCrossSellItems(itemId);
                    return {
                        itemId: item._id,
                        title: item.title,
                        shortDescription: item.shortDescription,
                        featureImage: {img: item.featureImage.img, imgDesc: item.featureImage.imgDesc}, // Pretpostavka da je featureImage objekat sa poljem img
                    };
                })
            );
        }

        // Update the item data
        const updatedItemData = {
            title: body.title,
            sku: body.sku,
            shortDescription: body.shortDescription,
            keyWords: body.keyWords,
            description: body.description,
            price: body.price,
            actionPrice: body.actionPrice,
            categories: body.categories,
            tags: body.tags,
            status: body.status,
            variations: body.variations,
            upSellItems: body.upSellItems,
            crossSellItems: body.crossSellItems
        };

        // Update feature image only if a new file is provided
        if (files && files.featureImage) {
            updatedItemData.featureImage = {
                img: files.featureImage[0].path,
                imgDesc: body.featureImageDesc
            };
        } else {
            updatedItemData.featureImage = existingItem.featureImage;
        }

        // Update video only if a new file is provided
        if (files && files.video) {
            updatedItemData.video = {
                vid: files.video[0].path,
                vidDesc: body.videoDesc
            };
        } else {
            updatedItemData.video = existingItem.video;
        }

        // Update variation images only if new files are provided
        if (files && files.variationImages) {
            updatedItemData.variations = body.variations.map((variation, index) => ({
                size: variation.size,
                color: variation.color,
                amount: variation.amount,
                image: {
                    img: files.variationImages[index] ? files.variationImages[index].path : "",
                    imgDesc: variation.imgDesc
                }
            }));
        } else {
            updatedItemData.variations = existingItem.variations;
        }

        // Save the updated item
        const updatedItem = await ItemService.updateItem(itemId, updatedItemData, files);

        if (!updatedItem) {
            ErrorHelper.throwConflictError("Nije uspelo ažuriranje artikla");
        }

        return res.redirect('/admin/artikal-detalji/'+itemId);
    } catch (error) {
        next(error);
    }
}

async function postSearchItems(req, res, next) {
    try {
        const search = sanitize(req.body.search);
        if (!search) {
            return res.redirect("/admin/artikli");
        }

        return res.redirect(`/admin/artikli?search=${search}`);
    } catch (error) {
        next(error)
    }
}

export default {
    getItemsPage,
    getItemDetailsPage,
    getAddItemPage,
    getEditItemPage,
    postAddItem,
    getAllCrosSellItems,
    getAllUpSellItems,
    postEditItem,
    postSearchItems
}