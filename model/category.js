import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  slug: String,

  shortDescription: String,

  longDescription: String,
  
  featureImage: {
    img: String,
    imgDesc: String
  }
});

export default model("Category", categorySchema);
