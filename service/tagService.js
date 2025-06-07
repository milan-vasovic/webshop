import ErrorHelper from '../helper/errorHelper.js';
import TagModel from '../model/tag.js';
import { generateSlug } from "../helper/slugHelper.js";
import sanitize from "mongo-sanitize";

class tagsService {
    static async creatTag(body) {
        try {
            const slug = generateSlug(sanitize(body.name));

            const doesExist = await TagModel.findOne({slug: slug});

            if (doesExist) {
                return ErrorHelper.throwConflictError("Oznaka sa tim slug vec postoji!")
            }

            const newtag = new TagModel({
                name: sanitize(body.name),
                slug: slug,
                type: sanitize(body.type),
                kind: sanitize(body.kind),
                shortDescription: sanitize(body.shortDescription),
                longDescription: sanitize(body.longDescription),
            });

            return newtag.save();
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async updateTag(body) {
        try {
            const existingTag = await TagModel.findById(body.tagId);

            if (!existingTag) {
                return ErrorHelper.throwNotFoundError("Oznaka");
            }

            const slug = generateSlug(sanitize(body.name));

            existingTag.name = sanitize(body.name) || existingTag.name;
            existingTag.slug = slug || existingTag.slug;
            existingTag.type = sanitize(body.type) || existingTag.type;
            existingTag.kind = sanitize(body.kind) || existingTag.kind,
            existingTag.shortDescription = sanitize(body.shortDescription) || existingTag.shortDescription;
            existingTag.longDescription = sanitize(body.longDescription) || existingTag.longDescription;

            return await existingTag.save();
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findTags(limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;

            const [tags, totalCount] = await Promise.all([
                TagModel.find()
                    .sort({ _id: -1 })
                    .select("name slug type kind shortDescription")
                    .skip(skip)
                    .limit(limit),

                TagModel.countDocuments()
             ])

            if (!tags) {
                return {
                    tags: [],
                    totalCount
                }
            }

            return {
                tags: this.mapTags(tags),
                totalCount
            }
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findTagById(id) {
        try {
            const tag = await TagModel.findById(id)

            if (!tag) {
                return ErrorHelper.throwNotFoundError("Oznaka");
            }

            return this.mapTag(tag);
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findTagsByIds(ids = []) {
        try {
            if (!ids.length) return [];
            return await TagModel.find({ _id: { $in: ids } }).select("name slug").lean();
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findTagsBySearch(search, limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;

            const filter = {};

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { slug: { $regex: search, $options: "i" } }
                ];
            }

            const [tags, totalCount] = await Promise.all([
                TagModel.find(filter)
                    .sort({ name: 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                TagModel.countDocuments(filter)
            ]);

            if (!tags || tags.length === 0) {
                ErrorHelper.throwNotFoundError("Tagovi");
            }

            return {
                tags: this.mapTags(tags),
                totalCount
            };
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findAllTagsForItems() {
        try {
            const tags = await TagModel.find({ kind: "item" })
            .select("name slug type kind")
            .sort({ type: 1, kind: 1, name: 1 })
            .lean();

            if (!tags) return [];

            return tags;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findAllTagsForPosts() {
        try {
            const tags = await TagModel.find({ kind: "post" })
            .select("name slug type kind")
            .sort({ type: 1, kind: 1, name: 1 })
            .lean();

            if (!tags) return [];

            return tags;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findTagsBySlugs(slugs = [], { returnIdsOnly = false } = {}) {
        try {
            const tags = await TagModel.find({ slug: { $in: slugs } }).select("_id name shortDescription").lean();

            return returnIdsOnly ? tags.map(tag => tag._id) : tags;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    

    static async findTagBySlug(slug) {
      return await TagModel.findOne({ slug }).lean();
    }

    static async searchTagIdsByTerm(term) {
        const results = await TagModel.find({
            $or: [
            { name: { $regex: term, $options: "i" } },
            { slug: { $regex: term, $options: "i" } }
            ]
        }).select("_id").lean();

        return results.map(tag => tag._id);
    }

    static async removeTagById(tagId, session) {
        try {
            const tag = await TagModel.findByIdAndDelete(tagId).session(session);
            
            if (!tag) {
                ErrorHelper.throwNotFoundError("Oznaka");
          }
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static mapTags(tags) {
        return tags.map((tag) => ({
            ID: { value: tag._id },
            Naziv: { value: tag.name },
            Slug: { value: tag.slug },
            Tip: { value: tag.kind },
            Vrsta: { value: tag.type },
            Opis: { value: tag.shortDescription },
            })
        )
    }

    static mapTag(tag) {
        return {
            ID: { value: tag._id },
            Naziv: { value: tag.name },
            Slug: { value: tag.slug },
            Tip: { value: tag.kind },
            Vrsta: { value: tag.type },
            'Kratak Opis': { value: tag.shortDescription },
            Opis: { value: tag.longDescription },
        }
    }
}

export default tagsService;