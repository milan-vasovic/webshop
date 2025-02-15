import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const customerSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },

    lastName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
    },

    telephoneNumber: [{
        number: {
            type: String,
            required: true
        }
    }],

    address: [{
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
    }],

    orders: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Order"
    }],
    
    acceptance: {
        type: Boolean,
        required: true,
        default: true,
    },
})

export default model('Customer', customerSchema);