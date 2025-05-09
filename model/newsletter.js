import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const newsletterSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    acceptance: {
        type: Boolean,
        required: true,
        default: true,
    },
})

export default model('Newsletter', newsletterSchema);