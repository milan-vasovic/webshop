import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const contactSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    telephoneNuber: {
        type: String,
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    acceptance: {
        type: Boolean,
        required: true,
        default: true,
    },
})

export default model('Contact', contactSchema);