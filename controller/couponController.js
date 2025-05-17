import {validationResult} from 'express-validator';
import sanitize from 'mongo-sanitize';

import CouponService from '../service/couponService.js';

/**
 * Renders the coupons page and check for search query params.
 */
async function getCouponsPage(req, res, next) {
    try {
        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 10;
        const coupons = await CouponService.findCoupons(limit, page);
        const totalPages = Math.ceil(coupons.totalCount / limit);

        return res.render("admin/coupon/coupons", {
            path: '/admin/kuponi',
            pageTitle: "Svi Kuponi",
            pageDescription: "Prikaz svih kupona za administratora",
            pageKeyWords: "Admin, Kuponi, Pretraga, Detalji, Brisanje",
            coupons: coupons,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/kuponi`,
            index: false,
            featureImage: undefined,
        })

    } catch (error) {
        next(error);
    }
}

async function getCouponBySearch(req, res, next) {
    try {
        const page = parseInt(sanitize(req.query.page)) || 1;
        const limit = 10;
        const search = req.params.search ? req.params.search : "";
        
        const param = sanitize(search)
        const coupons = await CouponService.findCouponsBySearch(param, limit, page);
        const totalPages = Math.ceil(coupons.totalCount / limit);

        return res.render("admin/coupon/coupons", {
            path: '/admin/kuponi',
            pageTitle: "Kuponi Pretraga: " + param,
            pageDescription: "Prikaz svih kupona za administratora",
            pageKeyWords: "Admin, Kuponi, Pretraga, Detalji, Brisanje",
            coupons: coupons,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/kuponi/pretraga/${param}`,
            index: false,
            featureImage: undefined,
        })
    } catch (error) {
        next(error);
    }
}

/**
 * Renders the coupon details page using copuonId.
 */
async function getCouponDetailsPage(req, res, next) {
    try {
        const couponId = req.params.couponId;

        const coupon = await CouponService.findCouponById(couponId);

        return res.render("admin/coupon/coupon-details", {
            path: '/admin/kupon-detalji',
            pageTitle: coupon.Kod.value,
            pageDescription: "Prikaz detalja kupona",
            pageKeyWords: "Admin, Kupon, Detalji, Informacije",
            coupon: coupon,
            index: false,
            featureImage: undefined,
        })

    } catch (error) {
        next(error);
    }
}

/**
 * Renders the add new coupon page.
 */
async function getAddCouponPage(req, res, next) {
    try {
        return res.render("admin/coupon/add-coupon", {
            path: '/admin/dodajte-kupon',
            pageTitle: "Dodavanje Kupona",
            pageDescription: "Prikaz forme za dodavanje novog kupona",
            pageKeyWords: "Admin, Kupon, Upravljanje, Dodavanje",
            editing: false,
            existingData: null,
            errorMessage: "",
            index: false,
            featureImage: undefined,
        })

    } catch (error) {
        next(error);
    }
}

/**
 * Renders the edit coupon page.
 */
async function getEditCouponPage(req, res, next) {
    try {
        const cupnId = req.params.couponId;

        const coupon = await CouponService.findCouponById(cupnId);
        const datumPocetkaString = coupon["Datum Početka"]?.value;
        const datumZavrsetkaString = coupon["Datum Završetka"]?.value;

        let datumPocetka = null;
        let datumZavrsetka = null;

        if (datumPocetkaString && datumPocetkaString !== "Nema Datuma") {
            const [d, m, y] = datumPocetkaString.split(".");
            datumPocetka = new Date(`${y}-${m}-${d}T00:00`);
        }

        if (datumZavrsetkaString && datumZavrsetkaString !== "Nema Datuma") {
            const [d, m, y] = datumZavrsetkaString.split(".");
            datumZavrsetka = new Date(`${y}-${m}-${d}T00:00`);
        }   
        
        return res.render("admin/coupon/add-coupon", {
            path: '/admin/doajte-kupon',
            pageTitle: "Dodavanje Kupona",
            pageDescription: "Prikaz forme za dodavanje novog kupona",
            pageKeyWords: "Admin, Kupon, Upravljanje, Dodavanje",
            editing: true,
            existingData: {
                ID: { value: coupon.ID.value },
                Status: { value: coupon.Status.value },
                Popust: { value: coupon.Popust.value },
                Količina: { value: coupon["Količina"].value },
                "Datum Početka": { value: datumPocetka },
                "Datum Završetka": { value: datumZavrsetka }
            },
            errorMessage: "",
            coupon: coupon,
            index: false,
            featureImage: undefined,
        })

    } catch (error) {
        next(error);
    }
}

/**
 * Handles the submission of a new coupon.
 */
async function postNewCoupon(req, res, next) {
    try {
        const code = sanitize(req.body.code);
        const status = sanitize(req.body.status);
        const discount = sanitize(req.body.discount);
        const amount = sanitize(req.body.amount) || 0;
        const startDate = sanitize(req.body.startDate) || undefined;
        const endDate = sanitize(req.body.endDate) || undefined;

        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.render("admin/coupon/add-coupon", {
                path: '/admin/doajte-kupon',
                pageTitle: "Dodavanje Kupona",
                pageDescription: "Prikaz forme za dodavanje novog kupona",
                pageKeyWords: "Admin, Kupon, Upravljanje, Dodavanje",
                editing: false,
                errorMessage: errors.array()[0].msg,
                existingData: {
                    Kod: { value: code },
                    Status: { value: status },
                    Popust: { value: discount },
                    Količina: { value: amount },
                    "Datum Početka": { value: startDate },
                    "Datum Završetka": { value: endDate },
                },
                index: false,
                featureImage: undefined,
            })
        }
        
        await CouponService.createCoupon(code, status, discount, amount, startDate, endDate);

        return res.redirect('/admin/kuponi');
    } catch (error) {
        next(error);
    }
}

/**
 * Handles the search form submission for coupons.
 */
async function postSearchCoupon(req, res, next) {
    try {
        const search = sanitize(req.body.search);
        if (!search) {
            return res.redirect("/admin/kuponi");
        }

        return res.redirect(`/admin/kuponi/pretraga/${search}`);

    } catch (error) {
        next(error);
    }
}

async function postEditCoupon(req, res, next) {
    try {
        const id = sanitize(req.body.couponId);
        const status = sanitize(req.body.status);
        const discount = sanitize(req.body.discount);
        const amount = sanitize(req.body.amount) || 0;
        const startDate = sanitize(req.body.startDate) || undefined;
        const endDate = sanitize(req.body.endDate) || undefined;

        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.render("admin/coupon/add-coupon", {
                path: '/admin/doajte-kupon',
                pageTitle: "Dodavanje Kupona",
                pageDescription: "Prikaz forme za dodavanje novog kupona",
                pageKeyWords: "Admin, Kupon, Upravljanje, Dodavanje",
                editing: false,
                errorMessage: errors.array()[0].msg,
                existingData: {
                    ID: { value: id },
                    Status: { value: status },
                    Popust: { value: discount },
                    Količina: { value: amount },
                    "Datum Početka": { value: startDate },
                    "Datum Završetka": { value: endDate }
                },
                index: false,
                featureImage: undefined,
            })
        }
        
        await CouponService.updateCoupon(id, {
            status: status,
            discount: discount,
            amount: amount,
            startDate: startDate,
            endDate: endDate
        });

        return res.redirect('/admin/kuponi');
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes a coupon by its ID.
 */
async function deleteCouponById(req, res, next) {
    try {
        const couponId = sanitize(req.body.itemId);

        const isDeleted = await CouponService.deleteCoupon(couponId);

        if (isDeleted) {
            return res.status(200).redirect('/admin/kuponi');
        }
    } catch (error) {
        next(error);
    }
}

export default {
    getCouponsPage,
    getCouponBySearch,
    getCouponDetailsPage,
    getAddCouponPage,
    getEditCouponPage,
    postNewCoupon,
    postEditCoupon,
    postSearchCoupon,
    deleteCouponById
}