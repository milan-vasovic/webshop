import mongoose from "mongoose";

import CouponModel from '../model/coupon.js';

import ErrorHelper from "../helper/errorHelper.js";

class CouponService {
    static async findCoupons(search, limit = 10, skip = null) {
        let filter = {};
    
        if (search) {
            const searchNumber = parseFloat(search); // Pretvaramo ako korisnik unese broj
            const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/; // Regex za DD.MM.YYYY format
    
            filter.$or = [];
    
            // Pretraga po ObjectId (pretvaramo string u ObjectId ako je moguće)
            if (mongoose.Types.ObjectId.isValid(search)) {
                filter.$or.push({ _id: search });
            }
    
            // Pretraga po kodu kupona (string)
            filter.$or.push({ code: { $regex: search, $options: "i" } });
    
            // Pretraga po statusu (pretpostavljamo da korisnik može uneti deo statusa)
            filter.$or.push({ status: { $regex: search, $options: "i" } });
    
            // Pretraga po popustu (pretvaramo search u broj ako je moguće)
            if (!isNaN(searchNumber)) {
                filter.$or.push({ discount: searchNumber });
            }
    
            // Pretraga po datumu (ako korisnik unese u formatu DD.MM.YYYY)
            if (dateRegex.test(search)) {
                const [day, month, year] = search.split(".").map(Number);
                const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
    
                filter.$or.push(
                    { startDate: { $gte: startDate, $lte: endDate } },
                    { endDate: { $gte: startDate, $lte: endDate } }
                );
            }
        }
    
        const coupons = await CouponModel.find(filter)
            .select("code status discount startDate endDate")
            .limit(limit)
            .lean();
    
        return this.mapCoupons(coupons);
    }
    
    static async findCouponById(couponId) {
        try {
            const coupon = await CouponModel.findById(couponId);

            if(!coupon) {
                ErrorHelper.throwNotFoundError("Kupon");
            }

            return this.mapCouponDetails(coupon);

        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async validateAndUseCoupon(couponCode) {
        try {
            const coupon = await CouponModel.findOne({code: couponCode})
                .select('_id status discount amount code');

            if (!coupon) {
                ErrorHelper.throwNotFoundError("Kupon")
            }

            if (!coupon.status.includes("active") && coupon.status.includes("inactive")) {
                ErrorHelper.throwConflictError("Kupon nije aktivan");
            }

            if (coupon.status.includes("amoun-sensitive")) {
                if (coupon.amount < 1) {
                    ErrorHelper.throwConflictError("Kupon je potršen, nema više aktivacija!");
                }
            }

            if (coupon.status.includes("time-sensitive")) {
                if(new Date() > coupon.endDate) {
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
          
          if (!coupon.status.includes("active") && coupon.status.includes("inactive")) {
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
            const userExists = coupon.users.some(id => id.toString() === userId.toString());
            if (userExists) {
              return ErrorHelper.throwConflictError("Korisnik je već iskoristio kupon");
            }
            coupon.users.push(userId);
            coupon.usedNumber += 1;
            await coupon.save({ session });
          }

          else if (coupon.status.includes("multiple-use")) {
            if (coupon.amount !== undefined) {
                coupon.usedNumber += 1;
                coupon.amount -= 1;
            }
            await coupon.save({ session });
          }
          
          return coupon;
        } catch (error) {
            return {status: false, msg: error};
        }
      }
    
    static async updateCoupon(couponId, body) {
        try {
            const existingCoupon = await CouponModel.findById(couponId);
            if (!existingCoupon) {
                ErrorHelper.throwNotFoundError("Kupon");
            }

            existingCoupon.status = body.status || existingCoupon.status;
            existingCoupon.discount = body.discount || existingCoupon.discount;
            existingCoupon.amount = body.amount || existingCoupon.amount;
            existingCoupon.startDate = body.startDate || existingCoupon.startDate;
            existingCoupon.endDate = body.endDate || existingCoupon.endDate;

            const updatedCoupon = await existingCoupon.save();
            return updatedCoupon;

        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async createCoupon(code, status, discount, amount, startDate, endDate) {
        try {
            const newCoupon = new CouponModel({
                code: code,
                status: status,
                discount: discount,
                amount: amount,
                startDate: startDate,
                endDate: endDate,
                users: []
            })

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
            "Datum Početka": { value: coupon.startDate || "Nema Datuma" },
            "Datum Završetka": { value: coupon.endDate || "Nema Datuma" },
        }))
    }

    static mapCouponDetails(coupon) {
        return {
            ID: { value: coupon._id },
            Kod: { value: coupon.code },
            Status: { value: coupon.status },
            Popust: { value: coupon.discount },
            Količina: { value: coupon.amount },
            "Broj Upotreba": { value: coupon.usedNumber },
            "Datum Početka": { value: coupon.startDate || "Nema Datuma"  },
            "Datum Završetka": { value: coupon.endDate || "Nema Datuma" },
            Korisnici: { value: coupon.users },
            Kupci: { value: coupon.customers }
        }
    }
}

export default CouponService;