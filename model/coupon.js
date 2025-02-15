import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },

    status: [{
        type: String,
        required: true,
        enum: ["acitve", "inactive", "single-use", "multiple-use","time-sensitive","amoun-sensitive"]
    }],

    discount: {
        type: Number,
        required: true,
        default: 5,
        min: 5,
        max: 100
    },

    amount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },

    usedNumber: {
        type: Number,
        required: true,
        default: 0
    },

    startDate: {
        type: Date
    },

    endDate: {
        type: Date
    },

    users: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    }]
})

export default model('coupon', couponSchema);