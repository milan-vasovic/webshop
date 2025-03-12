import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const temporaryOrderSchema = new Schema({
    buyer: {
        type: {
            type: String,
            enum: ['User', 'Customer'],
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
    
        lastName: {
            type: String,
            required: true
        },
    },

    email: {
        type: String,
        required: true
    },

    telephone: {
        type: String,
        required: true
    },

    address: {
        city: {
            type: String,
            required: true
        },
        street: {
            type: String,
            required: true
        },
        number: {
            type: String,
            required: true
        },
        postalCode: {
            type: String
        }
    },
    items: [{
        itemId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Item"
        },
        variationId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        size: {
            type: String,
            required: true,
            enum: ["XS","S","M","L","XL","2XL", "3XL", "4XL", "S/M", "M/L", "L/XL", "XL/2XL", "Uni"]
        },
        color: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        image: {
            type: String,
            required: true
        },
        code: {
            type: String
        },
    }],
    
    note: {
        type: String
    },

    shipping: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    coupon: {
        couponId: {
            type: Schema.Types.ObjectId,
            ref: "Cupon"
        },
        code: {
            type: String,
        },
        discount: {
            type: String
        }
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },

    createNewAccount: {
        type: Boolean,
        required: true,
        default: false
    },

    hasNewTelephone: {
        type: Boolean,
        required: true,
        default: false
    },

    hasNewAddress : {
        type: Boolean,
        required: true,
        default: false
    },

    verificationToken: { type: String, required: true },

    tokenExpiration: { type: Date, required: true }
})

export default model('TemporaryOrder', temporaryOrderSchema);