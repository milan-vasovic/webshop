import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        required: true
    },

    status: [{
        type: String,
        required: true
    }],

    resetToken: {
        type: String,
    },
    
    resetTokenExpiration: {
        type: Date,
    },

    confirmToken: {
        type: String,
    },

    confirmTokenExpiration: {
        type: Date,
    },

    firstName: {
        type: String,
        required: true
    },

    lastName: {
        type: String,
        required: true
    },

    telephoneNumbers: [{
        number: {
            type: String,
            required: true
        }
    }],

    addresses: [{
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

    cart: [{
        itemId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Item"
        },
        variationId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        size: {
            type: String,
            required: true,
        },
        color: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            default: 1
        },
        price: {
            type: Number,
            required: true,
        },
        code: {
            type: String
        }
    }],

    partner: {
        isPartner: {
            type: Boolean,
            required: true,
            default: false
        },
        history: [{
            type: Schema.Types.ObjectId,
            required: true,
            ref: "History"
        }],
        shop: {
            status: {
                type: Boolean,
                required: true,
                default: false
            },
            color: {
                type: String,
            },
            font: {
                type: String
            },
            logo: {
                type: String
            }
        },
        wallet: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        rank: {
            points: {
                type: Number,
                required: true,
                default: 0,
                min: 0
            },
            discount: {
                type: Number,
                required: true,
                min: 5,
                default: 5
            },
            level: {
                type: Number,
                required: true,
                default: 0,
                min: 0
            },
            maxOffers: {
                type: Number,
                required: true,
                min: 0,
                default: 0
            }
        },
        offers: [{
            itemId: {
                type: Schema.Types.ObjectId,
                required: true,
                ref: "Item"
            },
            code: {
                type: String,
                required: true
            }
        }]
    },
    acceptance: {
        type: Boolean,
        required: true,
        default: true,
    },

    confirmed: {
        type: Boolean,
        default: false,
    },
    
    lastLogin: {
        type: Date
    }
})

export default model('User', userSchema);