import {validationResult} from 'express-validator';
import sanitize from 'mongo-sanitize';

import CouponService from '../service/couponService.js';

/**
 * Renders the coupons page and check for search query params.
 */
async function getCouponsPage(req, res, next) {
    try {
        const search = sanitize(req.query.search);
        let coupons;

        if (search) {
            coupons = await CouponService.findCoupons(search);
        } else {
            coupons = await CouponService.findCoupons();
        }

        return res.render("admin/coupon/coupons", {
            path: '/admin/kuponi',
            pageTitle: "Svi Kuponi",
            pageDescription: "Prikaz svih kupona za administratora",
            pageKeyWords: "Admin, Kuponi, Pretraga, Detalji, Brisanje",
            coupons: coupons
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
            coupon: coupon
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
            path: '/admin/doajte-kupon',
            pageTitle: "Dodavanje Kupona",
            pageDescription: "Prikaz forme za dodavanje novog kupona",
            pageKeyWords: "Admin, Kupon, Upravljanje, Dodavanje",
            editing: false,
            existingData: null,
            errorMessage: "",
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

        const coupon = CouponService.findCouponById(cupnId);

        return res.render("admin/coupon/add-coupon", {
            path: '/admin/doajte-kupon',
            pageTitle: "Dodavanje Kupona",
            pageDescription: "Prikaz forme za dodavanje novog kupona",
            pageKeyWords: "Admin, Kupon, Upravljanje, Dodavanje",
            editing: false,
            existingData: null,
            errorMessage: "",
            coupon: coupon
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
                    "Datum Završetka": { value: endDate }
                }
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
function postSearchCoupon(req, res, next) {
    try {
        const search = sanitize(req.body.search);
        if (!search) {
            return res.redirect("/admin/kuponi");
        }

        return res.redirect(`/admin/kuponi?search=${search}`);

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
    getCouponDetailsPage,
    getAddCouponPage,
    getEditCouponPage,
    postNewCoupon,
    postSearchCoupon,
    deleteCouponById
}