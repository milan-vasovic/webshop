import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const forumSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    shortDescription: {
        type: String,
        required: true
    },
    keyWords: [{
        type: String,
        required: true
    }],
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
    categories: [{
        type: String,
        required: true
    }],
    tags: [{
        type: String,
        required: true
    }],
    description: {
        type: String,
        required: true
    },
    content: [{
        type: String,
        required: true
    }],
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
})

export default model('Forum', forumSchema);