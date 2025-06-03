import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const tagSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  slug: String,

  kind: String,

  shortDescription: String,

  longDescription: String,
});

export default model("Tag", tagSchema);
