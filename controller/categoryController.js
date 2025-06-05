import CategoriesService from "../service/categoriesService.js";
import { validationResult } from "express-validator";
import sanitize from "mongo-sanitize";
import mongoose from "mongoose";
import ItemService from "../service/itemService.js";

async function getCategoriesPage(req, res, next) {
    try {
        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 10;

        const categories = await CategoriesService.findCategories(limit, page);
        const totalPages = Math.ceil(categories.totalCount / limit);

        return res.render("admin/category/categories", {
            path: "/admin/kategorije",
            pageTitle: "Admin Kategorije",
            pageDescription: "Prikaz svih kategoriza za admina",
            pageKeyWords: "Admin, Kategorije, Upravljanje, Dodavanje",
            categories: categories,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/kategorije`,
            index: false,
            featureImage: undefined,
        });

    } catch (error) {
        next(error);
    }
}

async function getCategoryDetailsPage(req, res, next) {
    try {
        const categoryId = req.params.categoryId;

        const category = await CategoriesService.findCategoryById(categoryId);

        return res.render("admin/category/category-details", {
            path: "/admin/kategorija-detalji",
            pageTitle: category.Naziv.value,
            pageDescription: category["Kratak Opis"].value,
            pageKeyWords: [],
            category: category,
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}

async function getAddCategoryPage(req, res, next) {
    try {
        return res.render("admin/category/add-category", {
            path: "/admin/dodajte-kategoriju",
            pageTitle: "Dodajte Kategoriju",
            pageDescription: "Dodajte novu kategoriju",
            pageKeyWords: "Dodavanje, Kategorija, Admin",
            editing: false,
            existingData: null,
            errorMessage: "",
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}

async function getEditCategoryPage(req, res, next) {
    try {
        const categoryId = req.params.categoryId;

        const category = await CategoriesService.findCategoryById(categoryId);

        return res.render("admin/category/add-category", {
            path: "/admin/doadjte-kategoriju",
            pageTitle: "Izmenite Kategoriju",
            pageDescription: "Izmenite kategoriju",
            pageKeyWords: "Izmena, kategorija, Admin",
            errorMessage: "",
            editing: true,
            existingData: category,
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}

async function getSearchCategoriesPage(req, res, next) {
    try {
        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 10;
        const search = req.params.search ? req.params.search : "";
        
        const param = sanitize(search);
        const categories = await CategoriesService.findCategoriesBySearch(param, limit, page);
        const totalPages = Math.ceil(categories.totalCount / limit);

        return res.render("admin/category/categories", {
            path: "/admin/kategorije",
            pageTitle: "Admin Kategorije",
            pageDescription: "Prikaz svih kategorija za admina",
            pageKeyWords: "Admin, Kategorije, Upravljanje, Dodavanje",
            categories: categories,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/kategorije`,
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}

async function postSearchCategory(req, res, next) {
    try {
        const search = sanitize(req.body.search);

        if (!search) {
            return res.redirect("/admin/kategorije");
        }

        return res.redirect(`/admin/kategorije/pretraga/${search}`);
    } catch (error) {
        next(error);
    }
}

async function postAddCategory(req, res, next) {
    try {
        const body = req.body;
        const files = req.files;
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {        
            return res.render("admin/category/add-category", {
                path: "/admin/add-category",
                pageTitle: "Dodajte Kategoriju",
                pageDescription: "Dodajte novu kategoriju",
                pageKeyWords: "Dodavanje, Kategorija, Admin",
                existingData: {
                  Naziv: { value: body.name },
                  "Kratak Opis": { value: body.shortDescription },
                  Opis: { value: body.longDescription },
                  Slika: {
                    Opis: body.featureImageDesc,
                  },
                },
                editing: false,
                allUpsellItems: allUpsellItems,
                allCrosselItems: allCrosselItems,
                index: false,
                featureImage: undefined,
            });
        }

        await CategoriesService.createCategory(body, files)

        return res.redirect("/admin/kategorije");

    } catch (error) {
        next(error);
    }
}

async function postEditCategory(req, res, next) {
    try {
        const body = req.body;
        const files = req.files;
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {        
            return res.render("admin/category/add-category", {
                path: "/admin/dodajte-kategoriju",
                pageTitle: "Izmenite Kategoriju",
                pageDescription: "Izmenite novu kategoriju",
                pageKeyWords: "Izmena, Kategorija, Admin",
                existingData: {
                    ID: {value: body.categoryId },
                    Naziv: { value: body.name },
                    "Kratak Opis": { value: body.shortDescription },
                    Opis: { value: body.longDescription },
                    Slika: {
                    Opis: body.featureImageDesc,
                  },
                },
                editing: false,
                allUpsellItems: allUpsellItems,
                allCrosselItems: allCrosselItems,
                index: false,
                featureImage: undefined,
            });
        }
        await CategoriesService.updateCategory(body, files)

        return res.redirect("/admin/kategorija-detalji/"+body.categoryId);
    } catch (error) {
        next(error);
    }
}

async function deleteCategoryById(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const categoryId = sanitize(req.body.itemId);

        await ItemService.removeCategoryFromItems(categoryId, session);

        await CategoriesService.removeCategoryById(categoryId, session);

        await session.commitTransaction();

        return res.redirect("/admin/kategorije");

    } catch (error) {
        console.error(`Greška prilikom brisanja kategorije: ${error.message}`);

        if (session.inTransaction()) {
        await session.abortTransaction();
        }

        next(error);
    } finally {
        session.endSession();
    }
}

export default {
    getCategoriesPage,
    getCategoryDetailsPage,
    getAddCategoryPage,
    getEditCategoryPage,
    getSearchCategoriesPage,
    postSearchCategory,
    postAddCategory,
    postEditCategory,
    deleteCategoryById
}