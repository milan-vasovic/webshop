import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const historySchema = new Schema({
    partnerId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    
    itemId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    
    date: {
        type: Date,
        required: true,
        default: Date.now
    },

    amount: {
        type: Number,
        required: true,
        min: 1
    }
})

export default model('History', historySchema);