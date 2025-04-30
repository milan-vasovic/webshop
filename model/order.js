import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const orderSchema = new Schema({
    buyer: {
        type: {
            type: String,
            enum: ['User', 'Customer'],
            required: true
        },
        ref: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'buyer.type'
        },
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
            lowercase: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
                },
                message: props => `${props.value} is not a valid email!`
            }
        }
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
        title: {
            type: String,
            required: true
        },
        size: {
            type: String,
            required: true,
            enum: ["XS","S","M","L","XL","2XL", "3XL", "4XL", "XS/S", "S/M", "M/L", "L/XL", "XL/2XL", "2XL/3XL", "3XL/4XL", "Uni", "26","27","28","29","30","31","32","33","34","35"]
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
    status: {
        type: String,
        required: true,
        enum: ["processing", "sent-exchange", "pending-payment", "refund-period", "fulfilled", "exchanged", "returned", "cancelled", "failed"],
        default: "processing"
    },
    refundDate: {
        type: Date
    },
    exchangedOrderId: {
        type: Schema.Types.ObjectId,
        ref: "Order"
    },
})

export default model('Order', orderSchema);