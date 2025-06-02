import { validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import sanitize from "mongo-sanitize";
import mongoose from "mongoose";

import ErrorHelper from "../helper/errorHelper.js";
import ItemService from "../service/itemService.js";
import UserService from "../service/userService.js";
import CategoriesService from "../service/categoriesService.js";
import tagsService from "../service/tagService.js";

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
    const page = parseInt(sanitize(req.query.page)) || 1;
    const limit = 10;

    const items = await ItemService.findAdminItems(limit, page);

    const totalPages = Math.ceil(items.totalCount / limit);

    return res.render("admin/item/items", {
      path: "/admin/artikli",
      pageTitle: "Admin Artikli",
      pageDescription: "Prikaz svih artikala za admina",
      pageKeyWords: "Admin, Artikli, Upravljanje, Dodavanje",
      items: items,
      currentPage: page,
      totalPages: totalPages,
      basePath: `/admin/artikli`,
      index: false,
      featureImage: undefined,
    });
  } catch (error) {
    console.error(error)
    next(error);
  }
}

async function getSearchItemsPage(req, res, next) {
  try {
    const page = parseInt(sanitize(req.query.page)) || 1;
    const limit = 10;
    const search = req.params.search ? req.params.search : "";
    
    const param = sanitize(search)
    const items = await ItemService.findItemsBySearch(param, limit, page, true);
    const totalPages = Math.ceil(items.totalCount / limit);

    return res.render("admin/item/items", {
      path: "/admin/artikli",
      pageTitle: "Admin Artikli Pretraga: " + param,
      pageDescription: "Prikaz svih artikala za admina",
      pageKeyWords: "Admin, Artikli, Upravljanje, Dodavanje",
      items: items,
      currentPage: page,
      totalPages: totalPages,
      basePath: `/admin/artikli/pretraga/${search}`,
      index: false,
      featureImage: undefined,
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
      index: false,
      featureImage: undefined,
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
    const allUpsellItems = await ItemService.findItemsForAdminSelection({
      includeCategories: true,
      categorySlugs: [],
      excludeItemId: null
    });

    const allCrosselItems = await ItemService.findItemsForAdminSelection({
      includeCategories: false,
      categorySlugs: [],
      excludeItemId: null
    });

    const allCategories = await CategoriesService.findAllCategoriesForItems();
    const allTags = await tagsService.findAllTagsForItems();

    return res.render("admin/item/add-item", {
      path: "/admin/add-item",
      pageTitle: "Dodajte Artikal",
      pageDescription: "Dodajte novi artikal",
      pageKeyWords: "Dodavanje, Artikla, Admin",
      editing: false,
      existingData: null,
      errorMessage: "",
      allUpsellItems,
      allCrosselItems,
      allCategories,
      allTags,
      index: false,
      featureImage: undefined,
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

    const allUpsellItems = await ItemService.findItemsForAdminSelection({
      includeCategories: true,
      categorySlugs: [],
      excludeItemId: null
    });

    const allCrosselItems = await ItemService.findItemsForAdminSelection({
      includeCategories: false,
      categorySlugs: [],
      excludeItemId: null
    });

    const allCategories = await CategoriesService.findAllCategoriesForItems();
    const allTags = await tagsService.findAllTagsForItems();
 
    return res.render("admin/item/add-item", {
      path: "/admin/add-item",
      pageTitle: "Izmenite Artikal",
      pageDescription: "Izmenite artikal",
      pageKeyWords: "Izmena, Artikla, Admin",
      errorMessage: "",
      editing: true,
      existingData: item,
      allUpsellItems,
      allCrosselItems,
      allCategories,
      allTags,
      index: false,
      featureImage: undefined,
    });
  } catch (error) {
    next(error);
  }
}

// controllers/ItemController.js

async function getAllUpSellItems(req, res, next) {
  try {
    const categoryIds = req.query.categories?.split(",") || [];
    const itemId = req.query.itemId !== "undefined" ? req.query.itemId : null;

    const items = await ItemService.findItemsForAdminSelection({
      includeCategories: true, // up-sell → iste kategorije
      categoryIds,
      excludeItemId: itemId
    });

    return res.json(items);
  } catch (error) {
    next(error);
  }
}

async function getAllCrossSellItems(req, res, next) {
  try {
    const categoryIds = req.query.categories?.split(",") || [];
    const itemId = req.query.itemId !== "undefined" ? req.query.itemId : null;

    const items = await ItemService.findItemsForAdminSelection({
      includeCategories: false, // cross-sell → različite kategorije
      categoryIds,
      excludeItemId: itemId
    });

    return res.json(items);
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
      const allUpsellItems = await ItemService.findItemsForAdminSelection({
        includeCategories: true,
        categorySlugs: [],
        excludeItemId: null
      });

      const allCrosselItems = await ItemService.findItemsForAdminSelection({
        includeCategories: false,
        categorySlugs: [],
        excludeItemId: null
      });

      const allCategories = await CategoriesService.findAllCategoriesForItems();
      const allTags = await tagsService.findAllTagsForItems();

      return res.render("admin/item/add-item", {
        path: "/admin/add-item",
        pageTitle: "Dodajte Artikal",
        pageDescription: "Dodajte novi artikal",
        pageKeyWords: "Dodavanje, Artikla, Admin",
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
            Akcija: variation.onAction,
          })),
          "UpSell Artikli": { value: body.upSellItems },
          "CrossSell Artikli": { value: body.crossSellItems },
        },
        editing: false,
        allUpsellItems,
        allCrosselItems,
        allCategories,
        allTags,
        index: false,
        featureImage: undefined,
      });
    }

    const newItem = await ItemService.createNewItem(body, files);

    if (!newItem) {
      ErrorHelper.throwConflictError("Nije uspelo");
    }

    return res.redirect("/admin/artikli");
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

    // Sanitize osnovnih polja
    body.title = sanitizeHtml(body.title);
    body.sku = sanitizeHtml(body.sku);
    body.shortDescription = sanitizeHtml(body.shortDescription);
    body.description = sanitizeHtml(body.description);
    body.featureImageDesc = sanitizeHtml(body.featureImageDesc);
    body.videoDesc = sanitizeHtml(body.videoDesc);

    // Sanitize nizova
    if (Array.isArray(body.keyWords)) {
      body.keyWords = body.keyWords.map(k => sanitizeHtml(k));
    }
    if (Array.isArray(body.categories)) {
      body.categories = body.categories.map(c => sanitizeHtml(c));
    }
    if (Array.isArray(body.tags)) {
      body.tags = body.tags.map(t => sanitizeHtml(t));
    }

    // Sanitize varijacija
    if (body.variations) {
      body.variations = body.variations.map((variation) => ({
        _id: sanitize(variation.variationId),
        size: sanitizeHtml(variation.size),
        color: sanitizeHtml(variation.color),
        amount: parseInt(variation.amount),
        imgDesc: sanitizeHtml(variation.imgDesc),
      }));
    }

    const itemId = body.itemId;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const allUpsellItems = await ItemService.findItemsForAdminSelection({
        includeCategories: true,
        categorySlugs: [],
        excludeItemId: null,
      });

      const allCrosselItems = await ItemService.findItemsForAdminSelection({
        includeCategories: false,
        categorySlugs: [],
        excludeItemId: null,
      });

      const allCategories = await CategoriesService.findAllCategoriesForItems();
      const allTags = await tagsService.findAllTagsForItems();

      return res.render("admin/item/add-item", {
        path: "/admin/add-item",
        pageTitle: "Izmena Artikal",
        pageDescription: "Izmena artikal",
        pageKeyWords: "Izmena, Artikla, Admin",
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
            "Istaknuta Slika": { Opis: body.featureImageDesc },
          },
          Video: {
            Opis: { value: body.videoDesc },
          },
          Kategorije: { value: body.categories },
          Tagovi: { value: body.tags },
          Status: { value: body.status },
          Varijacije: body.variations.map(variation => ({
            Veličina: { value: variation.size },
            Boja: variation.color,
            Količina: variation.amount,
            Slika: { Opis: variation.imgDesc },
            ID: variation._id,
          })),
          "UpSell Artikli": body.upSellItems?.map(id => ({
            ID: { value: id },
            Naziv: { value: "Nepoznat (ID: " + id + ")" },
          })) || [],
          "CrossSell Artikli": body.crossSellItems?.map(id => ({
            ID: { value: id },
            Naziv: { value: "Nepoznat (ID: " + id + ")" },
          })) || [],
        },
        editing: true,
        allUpsellItems,
        allCrosselItems,
        allCategories,
        allTags,
        index: false,
        featureImage: undefined,
      });
    }

    // UpSell i CrossSell: obogaćivanje
    if (Array.isArray(body.upSellItems)) {
      body.upSellItems = await Promise.all(
        body.upSellItems.map(async (itemId) => {
          const item = await ItemService.findUpCrossSellItems(itemId);
          return {
            itemId: item._id,
            title: item.title,
            shortDescription: item.shortDescription,
            featureImage: {
              img: item.featureImage.img,
              imgDesc: item.featureImage.imgDesc,
            },
          };
        })
      );
    }

    if (Array.isArray(body.crossSellItems)) {
      body.crossSellItems = await Promise.all(
        body.crossSellItems.map(async (itemId) => {
          const item = await ItemService.findUpCrossSellItems(itemId);
          return {
            itemId: item._id,
            title: item.title,
            shortDescription: item.shortDescription,
            featureImage: {
              img: item.featureImage.img,
              imgDesc: item.featureImage.imgDesc,
            },
          };
        })
      );
    }

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

    return res.redirect(`/admin/artikli/pretraga/${search}`);
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
  getSearchItemsPage,
  getItemDetailsPage,
  getAddItemPage,
  getEditItemPage,
  postAddItem,
  getAllCrossSellItems,
  getAllUpSellItems,
  postEditItem,
  postAddUserToItemWishlist,
  postRemoveUserToItemWishlist,
  postSearchItems,
  deleteItemById,
};
