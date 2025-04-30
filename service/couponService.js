import mongoose from "mongoose";

import CouponModel from "../model/coupon.js";

import ErrorHelper from "../helper/errorHelper.js";

class CouponService {
  static async findCoupons(limit = 10, page = 1) {
    const skip = (page - 1) * limit;

    const coupons = await CouponModel.find()
      .sort({ startDate: -1, _id: -1 })
      .select("code status discount startDate endDate")
      .skip(skip)
      .limit(limit)
      .lean();

    if (!coupons) {
      ErrorHelper.throwNotFoundError("Kuponi");
    }

    const totalCount = await CouponModel.countDocuments();

    return {
      coupons: this.mapCoupons(coupons),
      totalCount: totalCount,
    };
  }

  static async findCouponsBySearch(search = "", limit = 10, page = 1) {
    try {
      const skip = (page - 1) * limit;
      const filter = {};
      const dateRegex = /^\d{2}\.\d{2}\.\d{4}\.?$/;
  
      if (search && typeof search === "string" && search.trim() !== "") {
        const searchTrimmed = search.trim();
        const orConditions = [];
  
        if (searchTrimmed.toLowerCase() === "nema datuma") {
          orConditions.push(
            { startDate: { $exists: false } },
            { endDate: { $exists: false } }
          );
        }
        
        // ✅ DATUM PRVO
        if (dateRegex.test(searchTrimmed)) {
          const [day, month, year] = searchTrimmed.replace(/\.$/, "").split(".").map(Number);
          const start = new Date(year, month - 1, day, 0, 0, 0);
          const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  
          orConditions.push(
            { startDate: { $gte: start, $lte: end } },
            { endDate: { $gte: start, $lte: end } }
          );
        } else {
          // ✅ Escape specijalnih karaktera
          const safeString = searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(safeString, "i");
  
          // ObjectId
          if (mongoose.Types.ObjectId.isValid(searchTrimmed)) {
            orConditions.push({ _id: new mongoose.Types.ObjectId(searchTrimmed) });
          }
  
          // code
          orConditions.push({ code: { $regex: regex } });
  
          // status
          orConditions.push({ status: { $elemMatch: { $regex: regex } } });
  
          // number
          const searchNumber = parseFloat(searchTrimmed);
          if (!isNaN(searchNumber)) {
            orConditions.push({ discount: searchNumber });
          }
        }
  
        if (orConditions.length > 0) {
          filter.$or = orConditions;
        }
      }
  
      const [totalCount, coupons] = await Promise.all([
        CouponModel.countDocuments(filter),
        CouponModel.find(filter)
          .sort({ startDate: -1, _id: 1 })
          .select("code status discount startDate endDate")
          .skip(skip)
          .limit(limit)
      ]);
  
      return {
        coupons: this.mapCoupons(coupons),
        totalCount
      };
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }     

  static async findCouponById(couponId) {
    try {
      const coupon = await CouponModel.findById(couponId);

      if (!coupon) {
        ErrorHelper.throwNotFoundError("Kupon");
      }

      return this.mapCouponDetails(coupon);
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async validateAndUseCoupon(couponCode) {
    try {
      const coupon = await CouponModel.findOne({ code: couponCode }).select(
        "_id status discount amount code"
      );

      if (!coupon) {
        ErrorHelper.throwNotFoundError("Kupon");
      }

      if (
        !coupon.status.includes("active") &&
        coupon.status.includes("inactive")
      ) {
        ErrorHelper.throwConflictError("Kupon nije aktivan");
      }

      if (coupon.status.includes("amoun-sensitive")) {
        if (coupon.amount < 1) {
          ErrorHelper.throwConflictError(
            "Kupon je potršen, nema više aktivacija!"
          );
        }
      }

      if (coupon.status.includes("time-sensitive")) {
        if (new Date() > coupon.endDate) {
          ErrorHelper.throwConflictError("Kupon je istekao!");
        }
      }

      return coupon;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findCouponStatusByIdAndUpdate(couponId, userId, session) {
    try {
      const coupon = await CouponModel.findById(couponId).session(session);
      if (!coupon) {
        ErrorHelper.throwNotFoundError("Kupon");
      }

      if (
        !coupon.status.includes("active") &&
        coupon.status.includes("inactive")
      ) {
        return ErrorHelper.throwConflictError("Kupon nije aktivan");
      }

      if (coupon.status.includes("time-sensitive")) {
        if (new Date() > coupon.endDate) {
          return ErrorHelper.throwConflictError("Kupon je istekao");
        }
      }

      if (coupon.status.includes("amoun-sensitive")) {
        if (coupon.amount !== undefined && coupon.amount < 1) {
          return ErrorHelper.throwConflictError("Kupon je potrošen");
        }
      }

      if (coupon.status.includes("single-use")) {
        const userExists = coupon.users.some(
          (id) => id.toString() === userId.toString()
        );
        if (userExists) {
          return ErrorHelper.throwConflictError(
            "Korisnik je već iskoristio kupon"
          );
        }
        coupon.users.push(userId);
        coupon.usedNumber += 1;
        await coupon.save({ session });
      } else if (coupon.status.includes("multiple-use")) {
        if (coupon.amount !== undefined) {
          coupon.usedNumber += 1;
          coupon.amount -= 1;
        }
        await coupon.save({ session });
      }

      return coupon;
    } catch (error) {
      return { status: false, msg: error };
    }
  }

  static async updateCoupon(couponId, body) {
    try {
      const existingCoupon = await CouponModel.findById(couponId);
      if (!existingCoupon) {
        ErrorHelper.throwNotFoundError("Kupon");
      }

      existingCoupon.status = body.status;
      existingCoupon.discount = body.discount;
      existingCoupon.amount = body.amount;
      existingCoupon.startDate = body.startDate;
      existingCoupon.endDate = body.endDate;

      const updatedCoupon = await existingCoupon.save();
      return updatedCoupon;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async createCoupon(
    code,
    status,
    discount,
    amount,
    startDate,
    endDate
  ) {
    try {
      const newCoupon = new CouponModel({
        code: code,
        status: status,
        discount: discount,
        amount: amount,
        startDate: startDate,
        endDate: endDate,
        users: [],
      });

      return newCoupon.save();
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async deleteCoupon(couponId) {
    try {
      const isDeleted = await CouponModel.findByIdAndDelete(couponId);

      if (!isDeleted) {
        ErrorHelper.throwNotFoundError("Kupon");
      }

      return isDeleted;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static mapCoupons(coupons) {
    return coupons.map((coupon) => ({
      ID: { value: coupon._id },
      Kod: { value: coupon.code },
      Status: { value: coupon.status },
      Popust: { value: coupon.discount },
      "Datum Početka": { value: coupon.startDate?.toLocaleDateString("sr-RS", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) || "Nema Datuma" },
      "Datum Završetka": { value: coupon.endDate?.toLocaleDateString("sr-RS", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) || "Nema Datuma" },
    }));
  }

  static mapCouponDetails(coupon) {
    return {
      ID: { value: coupon._id },
      Kod: { value: coupon.code },
      Status: { value: coupon.status },
      Popust: { value: coupon.discount },
      Količina: { value: coupon.amount },
      "Broj Upotreba": { value: coupon.usedNumber },
      "Datum Početka": { value: coupon.startDate?.toLocaleDateString("sr-RS", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) || "Nema Datuma" },
      "Datum Završetka": { value: coupon.endDate?.toLocaleDateString("sr-RS", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) || "Nema Datuma" },
      Korisnici: { value: coupon.users },
      Kupci: { value: coupon.customers },
    };
  }
}

export default CouponService;
