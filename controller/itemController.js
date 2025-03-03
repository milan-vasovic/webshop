import { validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import sanitize from "mongo-sanitize";
import mongoose from "mongoose";

import ErrorHelper from "../helper/errorHelper.js";
import ItemService from "../service/itemService.js";
import UserService from "../service/userService.js";

/**
 * Renders the items page for the admin.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
async function getItemsPage(req, res, next) {
  try {
    const search = sanitize(req.query.search);

    let items;
    if (search) {
      items = await ItemService.findAdminItems(search);
    } else {
      items = await ItemService.findAdminItems();
    }

    return res.render("admin/item/items", {
      path: "/admin/artikli",
      pageTitle: "Admin Artikli",
      pageDescription: "Prikaz svih artikala za admina",
      pageKeyWords: "Admin, Artikli, Upravljanje, Dodavanje",
      items: items,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Renders the item details page for the admin.
 */
async function getItemDetailsPage(req, res, next) {
  try {
    const itemId = req.params.itemId;

    const item = await ItemService.findItemDetailsByIdForAdmin(itemId);

    return res.render("admin/item/item-details", {
      path: "/admin/artikal-detalji",
      pageTitle: item.Nasolv,
      pageDescription: item["Kratak Opis"],
      pageKeyWords: item["Ključne Reči"],
      item: item,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Renders the add new item page for the admin.
 */
async function getAddItemPage(req, res, next) {
  try {
    const allUpsellItems = await ItemService.findAllAdminAddItems("");
    const allCrosselItems = await ItemService.findAllAdminAddItemsByCategory(
      ""
    );

    return res.render("admin/item/add-item", {
      path: "/admin/add-item",
      pageTitle: "Dodajte Artikal",
      editing: false,
      existingData: null,
      errorMessage: "",
      allUpsellItems: allUpsellItems,
      allCrosselItems: allCrosselItems,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Renders the edit item page for the admin.
 */
async function getEditItemPage(req, res, next) {
  try {
    const itemId = req.params.itemId;
    const item = await ItemService.findItemDetailsByIdForAdmin(itemId);
    const allUpsellItems = await ItemService.findAllAdminAddItems(
      item.Kategorije.value,
      itemId
    );
    const allCrosselItems = await ItemService.findAllAdminAddItemsByCategory(
      item.Kategorije.value,
      itemId
    );

    return res.render("admin/item/add-item", {
      path: "/admin/add-item",
      pageTitle: "Dodajte Artikal",
      errorMessage: "",
      editing: true,
      existingData: item,
      allUpsellItems: allUpsellItems,
      allCrosselItems: allCrosselItems,
    });
  } catch (error) {
    next(error);
  }
}

async function getAllCrosSellItems(req, res, next) {
  try {
    const categories = req.query.categories ? req.query.categories : "";
    const itemId = req.query.itemId ? req.query.itemId : "undefined";
    if (itemId === "undefined") {
      const items = await ItemService.findAllAdminAddItemsByCategory(
        categories
      );
      return res.json(items);
    }

    const items = await ItemService.findAllAdminAddItemsByCategory(
      categories,
      itemId
    );

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

    const allUpsellItems = await ItemService.findAllAdminAddItems(
      categories,
      itemId
    );

    return res.json(allUpsellItems);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the submission of a new item.
 */
async function postAddItem(req, res, next) {
  try {
    const body = req.body;
    const files = req.files;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const allUpsellItems = await ItemService.findAllAdminAddItems(
        body.categories,
        body.itemId
      );
      const allCrosselItems = await ItemService.findAllAdminAddItemsByCategory(
        body.categories,
        body.itemId
      );

      return res.render("admin/item/add-item", {
        path: "/admin/add-item",
        pageTitle: "Dodajte Artikal",
        errorMessage: errors.array()[0].msg,
        existingData: {
          Naziv: { value: body.title },
          SKU: { value: body.sku },
          "Kratak Opis": { value: body.shortDescription },
          "Ključne Reči": { value: body.keyWords },
          Opis: { value: body.description },
          Cena: { value: body.price },
          "Akcijska Cena": { value: body.actionPrice },
          Slike: {
            "Istaknuta Slika": {
              Opis: body.featureImageDesc,
            },
          },
          Video: {
            Opis: { value: body.videoDesc },
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
          "CrossSell Artikli": { value: body.crossSellItems },
        },
        editing: false,
        allUpsellItems: allUpsellItems,
        allCrosselItems: allCrosselItems,
      });
    }

    const newItem = await ItemService.createNewItem(body, files);

    if (!newItem) {
      ErrorHelper.throwConflictError("Nije uspelo");
    }

    return res.redirect("/prodavnica");
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the edit of a existing item.
 */
async function postEditItem(req, res, next) {
  try {
    const body = sanitize(req.body);
    const files = sanitize(req.files);

    // Sanitizacija osnovnih podataka
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
      body.categories = body.categories.map((category) =>
        sanitizeHtml(category)
      );
    }
    if (body.tags) {
      body.tags = body.tags.map((tag) => sanitizeHtml(tag));
    }
    // Sanitizacija varijacija – svaka varijacija ima i skriveno polje variationId
    if (body.variations) {
      body.variations = body.variations.map((variation) => ({
        _id: sanitize(variation.variationId), // može biti privremeni ID (npr. "new-12345") ili postojeći ObjectId
        size: sanitizeHtml(variation.size),
        color: sanitizeHtml(variation.color),
        amount: variation.amount,
        imgDesc: sanitizeHtml(variation.imgDesc),
      }));
    }

    const itemId = body.itemId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const allUpsellItems = await ItemService.findAllAdminAddItems(
        body.categories,
        itemId
      );
      const allCrosselItems = await ItemService.findAllAdminAddItemsByCategory(
        body.categories,
        itemId
      );

      return res.render("admin/item/add-item", {
        path: "/admin/add-item",
        pageTitle: "Uredite Artikal",
        errorMessage: errors.array()[0].msg,
        existingData: {
          ID: itemId,
          Naziv: { value: body.title },
          SKU: { value: body.sku },
          "Kratak Opis": { value: body.shortDescription },
          "Ključne Reči": { value: body.keyWords },
          Opis: { value: body.description },
          Cena: { value: body.price },
          "Akcijska Cena": { value: body.actionPrice },
          Slike: {
            "Istaknuta Slika": {
              Opis: body.featureImageDesc,
            },
          },
          Video: {
            Opis: { value: body.videoDesc },
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
          "CrossSell Artikli": { value: body.crossSellItems },
        },
        editing: true,
        allUpsellItems: allUpsellItems,
        allCrosselItems: allCrosselItems,
      });
    }

    if (body.upSellItems) {
        body.upSellItems = await Promise.all(
            body.upSellItems.map(async (itemId) => {
                const item = await ItemService.findUpCrossSellItems(itemId);
                return {
                    itemId: item._id,
                    title: item.title,
                    shortDescription: item.shortDescription,
                    featureImage: {img: item.featureImage.img, imgDesc: item.featureImage.imgDesc}
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
                    featureImage: {img: item.featureImage.img, imgDesc: item.featureImage.imgDesc},
                };
            })
        );
    }

    // Pozovi updateItem funkciju iz servisa – sve logičke provere i mapiranje obavi se tamo
    const updatedItem = await ItemService.updateItem(itemId, body, files);
    if (!updatedItem) {
      ErrorHelper.throwConflictError("Nije uspelo ažuriranje artikla");
    }
    return res.redirect("/admin/artikal-detalji/" + itemId);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the search form submission for items.
 */
async function postSearchItems(req, res, next) {
  try {
    const search = sanitize(req.body.search);
    if (!search) {
      return res.redirect("/admin/artikli");
    }

    return res.redirect(`/admin/artikli?search=${search}`);
  } catch (error) {
    next(error);
  }
}

async function postAddUserToItemWishlist(req, res, next) {
    try {
        const userId = req.session.user._id;
        const itemId = req.body.itemId;

        const item = await ItemService.addUserToItemWishlist(userId, itemId);

        return res.redirect("/prodavnica/artikal/" + item.title);
    } catch (error) {
        next(error);
    }
}

async function postRemoveUserToItemWishlist(req, res, next) {
    try {
        const userId = req.session.user._id;
        const itemId = req.body.itemId;

        const item = await ItemService.removeUserFromItemWishlist(userId, itemId);

        return res.redirect("/prodavnica/artikal/" + item.title);
    } catch (error) {
        next(error);
    }
}

/**
 * Handles the deletion of existing item and removing its references from other items and users.
 */
async function deleteItemById(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const itemId = sanitize(req.body.itemId);

    const item = await ItemService.detachItemReferences(itemId, session);

    await UserService.removeItemFromCarts(item._id, session);
    await UserService.removeItemFromPartnerOffers(item._id, session);

    await ItemService.deleteItemById(itemId, session);

    await session.commitTransaction();

    return res.redirect("/admin/artikli");
  } catch (error) {
    console.error(`Greška prilikom brisanja artikla: ${error.message}`);

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    next(error);
  } finally {
    session.endSession();
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
  postAddUserToItemWishlist,
  postRemoveUserToItemWishlist,
  postSearchItems,
  deleteItemById,
};
