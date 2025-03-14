import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const itemSchema = new Schema({
    title: {
        type: String,
        required: true
    },

    sku: {
        type: String,
        required: true,
        unique: true
    },

    shortDescription: {
        type: String,
        required: true
    },

    keyWords: [{
        type: String,
        required: true
    }],

    description: {
        type: String,
        required: true
    },

    featureImage: {
        img: {
            type: String,
            required: true
        },
        imgDesc: {
            type: String,
            required: true
        }
    },

    video: {
        type: new Schema({
            vid: {
                type: String,
                required: true
            },
            vidDesc: {
                type: String,
                required: true
            }
        }),
        required: false
    },

    categories: [{
        type: String,
        required: true
    }],

    tags: [{
        type: String,
        required: true
    }],

    status: [{
        type: String,
        required: true,
        enum: ["action","featured","empty", "normal","partnership"]
    }],
    
    price: {
        type: Number,
        required: true,
        min: 100,
        default: 100
    },

    actionPrice: {
        type: Number,
        required: true,
        min: 100,
        default: 100
    },

    backorder: {
        isAllowed: {
            type: Boolean,
            required: true,
            default: false
        },
        orders: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User"
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
            amount: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            },
        }]
    },

    variations: [{
        size: {
            type: String,
            required: true,
            enum: ["XS","S","M","L","XL","2XL", "3XL", "4XL", "S/M", "M/L", "L/XL", "XL/2XL", "Uni"]
        },
        color: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        image: {
            img: {
                type: String,
            },
            imgDesc: {
                type: String,
            }
        }
    }],

    upSellItems: [{
        itemId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Item"
        },
        title: {
            type: String,
            required: true
        },
        shortDescription: {
            type: String,
            required: true
        },
        featureImage: {
            img: {
                type: String,
                required: true
            },
            imgDesc: {
                type: String,
                required: true
            }
        }
    }],

    crossSellItems: [{
        itemId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Item"
        },
        title: {
            type: String,
            required: true
        },
        shortDescription: {
            type: String,
            required: true
        },
        featureImage: {
            img: {
                type: String,
                required: true
            },
            imgDesc: {
                type: String,
                required: true
            }
        }
    }],

    partners: [{
        partnerId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        partnerCode: {
            type: String,
            required: true
        },
        partnerShare: {
            type: Number,
            required: true,
            deafult: 1
        }
    }],

    soldCount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },

    returnedCount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },

    wishlist: [{
        userId: {
            type: Schema.Types.ObjectId,
            requried: true,
            ref: "User"
        }
    }]
})
export default model('Item', itemSchema);