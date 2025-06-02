import TagService from "../service/tagService.js";
import { validationResult } from "express-validator";
import sanitize from "mongo-sanitize";
import mongoose from "mongoose";
import ItemService from "../service/itemService.js";

async function getTagsPage(req, res, next) {
    try {
        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 10;

        const tags = await TagService.findTags(limit, page);
        const totalPages = Math.ceil(tags.totalCount / limit);

        return res.render("admin/tag/tags", {
            path: "/admin/oznake",
            pageTitle: "Admin Oznake",
            pageDescription: "Prikaz svih oznaka za admina",
            pageKeyWords: "Admin, Oznake, Upravljanje, Dodavanje",
            tags: tags,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/oznake`,
            index: false,
            featureImage: undefined,
        });

    } catch (error) {
        next(error);
    }
}

async function getTagDetailsPage(req, res, next) {
    try {
        const tagId = req.params.tagId;

        const tag = await TagService.findTagById(tagId);

        return res.render("admin/tag/tag-details", {
            path: "/admin/oznaka-detalji",
            pageTitle: tag.Naziv.value,
            pageDescription: tag["Kratak Opis"].value,
            pageKeyWords: [],
            tag: tag,
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}

async function getAddTagPage(req, res, next) {
    try {
        return res.render("admin/tag/add-tag", {
            path: "/admin/dodajte-oznaku",
            pageTitle: "Dodajte Oznaku",
            pageDescription: "Dodajte novu oznaku",
            pageKeyWords: "Dodavanje, Oznaka, Admin",
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

async function getEditTagPage(req, res, next) {
    try {
        const tagId = req.params.tagId;

        const tag = await TagService.findTagById(tagId);

        return res.render("admin/tag/add-tag", {
            path: "/admin/dodajte-oznaku",
            pageTitle: "Izmenite Oznaku",
            pageDescription: "Izmenite oznaku",
            pageKeyWords: "Izmena, Oznaka, Admin",
            errorMessage: "",
            editing: true,
            existingData: tag,
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}

async function getSearchTagPage(req, res, next) {
  try {
    const page = parseInt(sanitize(req.query.page)) || 1;
    const limit = 10;
    const search = req.params.search ? req.params.search : "";
    
    const param = sanitize(search);
    const tags = await TagService.findTagsBySearch(param, limit, page);
    const totalPages = Math.ceil(tags.totalCount / limit);

    return res.render("admin/tag/tags", {
        path: "/admin/oznake",
        pageTitle: "Admin Oznake",
        pageDescription: "Prikaz svih oznaka za admina",
        pageKeyWords: "Admin, Oznake, Upravljanje, Dodavanje",
        tags: tags,
        currentPage: page,
        totalPages: totalPages,
        basePath: `/admin/oznake`,
        index: false,
        featureImage: undefined,
    });
  } catch (error) {
    next(error);
  }
}

async function postSearchTag(req, res, next) {
    try {
        const search = sanitize(req.body.search);

        if (!search) {
            return res.redirect("/admin/oznake");
        }

        return res.redirect(`/admin/oznake/pretraga/${search}`);
    } catch (error) {
        next(error);
    }
}

async function postAddTag(req, res, next) {
    try {
        const body = req.body;
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {        
            return res.render("admin/tag/add-tag", {
                path: "/admin/dodajte-oznaku",
                pageTitle: "Dodajte Oznaku",
                pageDescription: "Dodajte novu oznaku",
                pageKeyWords: "Dodavanje, Oznaka, Admin",
                existingData: {
                  Naziv: { value: body.name },
                  "Kratak Opis": { value: body.shortDescription },
                  Opis: { value: body.longDescription },
                },
                editing: false,
                allUpsellItems: allUpsellItems,
                allCrosselItems: allCrosselItems,
                index: false,
                featureImage: undefined,
            });
        }

        await TagService.creatTag(body)

        return res.redirect("/admin/oznake");

    } catch (error) {
        next(error);
    }
}

async function postEditTag(req, res, next) {
    try {
        const body = req.body;
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {        
            return res.render("admin/tag/add-tag", {
                path: "/admin/dodajte-oznaku",
                pageTitle: "Izmenite Oznaku",
                pageDescription: "Izmenite novu oznaku",
                pageKeyWords: "Izmena, Oznaka, Admin",
                existingData: {
                    ID: {value: body.tagId },
                    Naziv: { value: body.name },
                    "Kratak Opis": { value: body.shortDescription },
                    Opis: { value: body.longDescription },
                },
                editing: false,
                allUpsellItems: allUpsellItems,
                allCrosselItems: allCrosselItems,
                index: false,
                featureImage: undefined,
            });
        }
        await TagService.updateTag(body)

        return res.redirect("/admin/oznaka-detalji/"+body.tagId);
    } catch (error) {
        next(error);
    }
}

async function deleteTagById(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const tagId = sanitize(req.body.itemId);

        await ItemService.removeTagFromItems(tagId, session);

        await TagService.removeTagById(tagId, session);

        await session.commitTransaction();

        return res.redirect("/admin/oznake");

    } catch (error) {
        console.error(`Greška prilikom brisanja oznake: ${error.message}`);

        if (session.inTransaction()) {
        await session.abortTransaction();
        }

        next(error);
    } finally {
        session.endSession();
    }
}

export default {
    getTagsPage,
    getTagDetailsPage,
    getAddTagPage,
    getEditTagPage,
    getSearchTagPage,
    postSearchTag,
    postAddTag,
    postEditTag,
    deleteTagById
}