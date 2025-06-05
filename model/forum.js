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
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    }],
    tags: [{
        type: Schema.Types.ObjectId,
        ref: "Tag",
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