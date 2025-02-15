import ErrorHelper from "../helper/errorHelper.js";
import CouponModel from '../model/coupon.js';

class CouponService {
    static async findCoupons(limit = 10, skip = null) {
        const coupons = await CouponModel.find()
            .select("code status price discount startDate endDate")
            .limit(limit)
            .lean();

        if (!coupons) {
            ErrorHelper.throwNotFoundError("Kuponi");
        }

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
                console.log("Nema")
                ErrorHelper.throwNotFoundError("Kupon")
            }

            if (!coupon.status.includes("active") && coupon.status.includes("inactive")) {
                console.log("Neaktivan")
                return ErrorHelper.throwConflictError("Kupon nije aktivan");
            }

            if (coupon.status.includes("amoun-sensitive")) {
                if (coupon.amount < 1) {
                    console.log("Nema kolicine")
                    return ErrorHelper.throwConflictError("Kupon je potršen, nema više aktivacija!");
                }
            }

            if (coupon.status.includes("time-sensitive")) {
                if(new Date() > coupon.endDate) {
                    console.log("Istekao")
                    return ErrorHelper.throwConflictError("Kupon je istekao!");
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