import ErrorHelper from '../helper/errorHelper.js';
import CategoryModel from '../model/category.js';
import { generateSlug } from "../helper/slugHelper.js";
import sanitize from "mongo-sanitize";

class CategoriesService {
    static async createCategory(body, files) {
        try {
            const slug = generateSlug(sanitize(body.name));

            const doesExist = await CategoryModel.findOne({slug: slug});

            if (doesExist) {
                return ErrorHelper.throwConflictError("Kategorija sa tim slug vec postoji!")
            }

            const featureImageFile = files.find(file => file.fieldname === 'featureImage');
            const featureImage = {
              img: featureImageFile ? featureImageFile.originalname : null,
              imgDesc: sanitize(body.featureImageDesc || ""),
            };

            const newCategory = new CategoryModel({
                name: sanitize(body.name),
                slug: slug,
                kind: sanitize(body.kind),
                shortDescription: sanitize(body.shortDescription),
                longDescription: sanitize(body.longDescription),
                featureImage: featureImage
            });

            return newCategory.save();
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async updateCategory(body, files) {
        try {
            const existingCategory = await CategoryModel.findById(body.categoryId);

            if (!existingCategory) {
                return ErrorHelper.throwNotFoundError("Kategorija");
            }

            const featureImageFile = files.find(file => file.fieldname === 'featureImage');
            const slug = generateSlug(sanitize(body.name));

            existingCategory.name = sanitize(body.name) || existingCategory.name;
            existingCategory.slug = slug || existingCategory.slug;
            existingCategory.kind = sanitize(body.kind) || existingCategory.kind;
            existingCategory.shortDescription = sanitize(body.shortDescription) || existingCategory.shortDescription;
            existingCategory.longDescription = sanitize(body.longDescription) || existingCategory.longDescription;
            existingCategory.featureImage = {
                img: featureImageFile ? featureImageFile.originalname : null || existingCategory.featureImage.img,
                imgDesc: sanitize(body.featureImageDesc) || existingCategory.featureImage.imgDesc
            }

            return await existingCategory.save();
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findCategories(limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;

            const [categories, totalCount] = await Promise.all([
                CategoryModel.find()
                    .sort({ _id: -1 })
                    .select("name slug kind shortDescription featureImage")
                    .skip(skip)
                    .limit(limit),

                CategoryModel.countDocuments()
             ])

            if (!categories) {
                return {
                    categories: [],
                    totalCount
                }
            }

            return {
                categories: this.mapCategories(categories),
                totalCount
            }
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findCategoriesBySearch(search, limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;

            const filter = {};

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { slug: { $regex: search, $options: "i" } },
                    { kind: { $regex: search, $options: "i" } }
                ];
            }

            const [categories, totalCount] = await Promise.all([
                CategoryModel.find(filter)
                    .sort({ name: 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                CategoryModel.countDocuments(filter)
            ]);

            if (!categories || categories.length === 0) {
                ErrorHelper.throwNotFoundError("Kategorije");
            }

            return {
                categories: this.mapCategories(categories),
                totalCount
            };
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async searchCategoryIdsByTerm(term) {
        const results = await CategoryModel.find({
            $or: [
            { name: { $regex: term, $options: "i" } },
            { slug: { $regex: term, $options: "i" } }
            ]
        }).select("_id").lean();

        return results.map(cat => cat._id);
    }

    static async findCategoryById(id) {
        try {
            const category = await CategoryModel.findById(id)

            if (!category) {
                return ErrorHelper.throwNotFoundError("Kategorija");
            }

            return this.mapCategory(category);
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findCategoriesByIds(ids = []) {
        try {
            if (!ids.length) return [];
            return await CategoryModel.find({ _id: { $in: ids } }).select("name slug").lean();
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findCategoryBySlug(slug) {
        return await CategoryModel.findOne({ slug }).lean();
    }

    // Chage it to use new logic
    static async findAllCategoriesForItems() {
        try {
            const categories = await CategoryModel.find({kind: "item"}).select("name slug").lean();

            if (!categories) {
                return [];
            }
            
            return categories;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findAllCategoriesForPosts() {
        try {
            const categories = await CategoryModel.find({kind: 'post'}).select('name slug').lean();

            if (!categories) {
                return [];
            }

            return categories;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findCategoriesBySlugs(slugs = [], { returnIdsOnly = false } = {}) {
        try {
            const categories = await CategoryModel.find({ slug: { $in: slugs } }).select("_id").lean();

            if (returnIdsOnly) {
            return categories.map(cat => cat._id);
            }

            return categories;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async removeCategoryById(categoryId, session) {
        try {
            const category = await CategoryModel.findByIdAndDelete(categoryId).session(session);
            
            if (!category) {
                ErrorHelper.throwNotFoundError("Kategorija");
          }
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static mapCategories(categories) {
        return categories.map((category) => ({
            ID: { value: category._id },
            Naziv: { value: category.name },
            Slug: { value: category.slug },
            Tip: { value: category.kind },
            Opis: { value: category.shortDescription },
            Slika: {
                value: category.featureImage.img,
                Opis: category.featureImage.imgDesc 
                }
            })
        )
    }

    static mapCategory(category) {
        return {
            ID: { value: category._id },
            Naziv: { value: category.name },
            Slug: { value: category.slug },
            Tip: { value: category.kind },
            'Kratak Opis': { value: category.shortDescription },
            Opis: { value: category.longDescription },
            Slika: {
                URL: category.featureImage.img,
                Opis: category.featureImage.imgDesc 
            }
        }
    }
}

export default CategoriesService;