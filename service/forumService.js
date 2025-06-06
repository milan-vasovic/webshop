import ForumModel from '../model/forum.js';
import { generateSlug } from "../helper/slugHelper.js";
import CategoriesService from './categoriesService.js';
import TagService from './tagService.js';

import ErrorHelper from '../helper/errorHelper.js';

class ForumService {
    static async findPosts(limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;
            const posts = await ForumModel.find()
                .populate('categories tags')
                .sort({ _id: 1})
                .skip(skip)
                .limit(limit)
                .exec();

            if (!posts || posts.length === 0) {
                ErrorHelper.throwNotFoundError('Objava');
            }

            const postCount = await ForumModel.find().countDocuments();
            return {
                posts: this.mapPosts(posts),
                totalPosts: postCount,
            }
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    
    static async findPostById(id) {
        try {
            const post = await ForumModel.findById(id).populate('categories tags');

            if (!post) {
                ErrorHelper.throwNotFoundError('Objava');
            }

            return this.mapPostDetails(post);

        } catch (error) {
            ErrorHelper.throwServerError(error);
            
        }
    }

    static async findPostBySlug(slug) {
        try {
            const post = await ForumModel.findOne({ slug: slug }).populate('categories tags');

            if (!post) {
                ErrorHelper.throwNotFoundError('Objava');
            }

            return this.mapPostDetails(post);

        } catch (error) {
            ErrorHelper.throwServerError(error);
            
        }
    }

    static async findPostsByCategory(category, limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;
            const slugs = Array.isArray(category)
                ? category
                : category.split(",").map(c => c.trim());

            const categoryIds = await CategoriesService.findCategoriesBySlugs(slugs, { returnIdsOnly: true });

            if (!categoryIds.length) {
                return { posts: [], totalPosts: 0 };
            }

            const filter = { categories: { $in: categoryIds } };

            const [posts, postCount] = await Promise.all([
                ForumModel.find(filter)
                    .sort({ _id: 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                ForumModel.countDocuments(filter)
            ]);

            const metadataCategory = (await CategoriesService.findCategoriesBySlugs(slugs))[0];

            return {
                posts: ForumService.mapPosts(posts),
                totalPosts: postCount,
                metadata: {
                    title: metadataCategory?.name || "",
                    description: metadataCategory?.shortDescription || "",
                    longDescription: metadataCategory?.longDescription || ""
                }
            };
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findPostsByTags(tag, limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;
            const slugs = Array.isArray(tag)
                ? tag
                : tag.split(",").map(t => t.trim());

            const tagIds = await TagService.findTagsBySlugs(slugs, { returnIdsOnly: true });

            if (!tagIds.length) {
                return { posts: [], totalPosts: 0 };
            }

            const filter = { tags: { $in: tagIds } };

            const [posts, postCount] = await Promise.all([
                ForumModel.find(filter)
                    .sort({ _id: 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                ForumModel.countDocuments(filter)
            ]);

            const metadataTag = (await TagService.findTagsBySlugs(slugs))[0];

            return {
                posts: ForumService.mapPosts(posts),
                totalPosts: postCount,
                metadata: {
                    title: metadataTag?.name || "",
                    description: metadataTag?.shortDescription || "",
                    longDescription: metadataTag?.longDescription || ""
                }
            };
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findPostsBySearch(search, limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;
            const searchRegex = new RegExp(search, "i");

            // Osnovni uslovi pretrage za tekstualna polja posta
            const searchConditions = [
            { title: { $regex: searchRegex } },
            { slug: { $regex: searchRegex } },
            { keyWords: { $regex: searchRegex } }
            ];

            // Pretraga kategorija po imenu ili slug-u
            const categoryIds = await CategoriesService.searchCategoryIdsByTerm(search);
            if (categoryIds.length > 0) {
            searchConditions.push({ categories: { $in: categoryIds } });
            }

            // Pretraga tagova po imenu ili slug-u
            const tagIds = await TagService.searchTagIdsByTerm(search);
            if (tagIds.length > 0) {
            searchConditions.push({ tags: { $in: tagIds } });
            }

            // Glavni MongoDB filter koristi OR logiku (poklapanje u bilo kojoj oblasti)
            const filter = { $or: searchConditions };

            const [posts, postCount] = await Promise.all([
            ForumModel.find(filter)
                .sort({ _id: -1 }) // najnovije prve
                .skip(skip)
                .limit(limit)
                .lean(),
            ForumModel.countDocuments(filter)
            ]);

            if (!posts || posts.length === 0) {
            ErrorHelper.throwNotFoundError("Objave");
            }

            return {
            posts: ForumService.mapPosts(posts),
            totalPosts: postCount
            };
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findPostsCategories(tagSlug) {
        try {
            const slugs = Array.isArray(tagSlug) ? tagSlug : tagSlug.split(",").map(s => s.trim());
            const tagIds = await TagService.findTagsBySlugs(slugs, { returnIdsOnly: true });

            if (!tagIds.length) return { Kategorije: [] };

            const categoryIds = await ForumModel.find({ tags: { $in: tagIds } }).distinct('categories');
            const categories = await CategoriesService.findCategoriesByIds(categoryIds);

            return {
            Kategorije: categories.map(cat => ({
                Naziv: cat.name,
                Slug: cat.slug
            }))
            };
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findPostsTags(categorySlug) {
        try {
            const slugs = Array.isArray(categorySlug) ? categorySlug : categorySlug.split(",").map(s => s.trim());
            const categoryIds = await CategoriesService.findCategoriesBySlugs(slugs, { returnIdsOnly: true });

            if (!categoryIds.length) return { Tagovi: [] };

            const tagIds = await ForumModel.find({ categories: { $in: categoryIds } }).distinct('tags');
            const tags = await TagService.findTagsByIds(tagIds);

            return {
            Tagovi: tags.map(tag => ({
                Naziv: tag.name,
                Slug: tag.slug,
                Vrsta: tag.type,
                Tip: tag.kind
            }))
            };
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findAllCategories() {
        const categories = await CategoriesService.findAllCategoriesForPosts();
    
        return {  
          Kategorije: categories.map((category) => ({
            ID: category._id ,
            Naziv: category.name,
            Slug: category.slug
          }))
        };
      }
    
    static async findAllTags() {
        const tags = await TagService.findAllTagsForPosts()
    
        return {
          Tagovi: tags.map((tag) => ({
            Naziv: tag.name,
            Tip: tag.kind,
            Vrsta: tag.type,
            Slug: tag.slug,
          })),
        };
    }

    static async createPost(title, shortDescription, keyWords, featureImageDescription, categories, tags, description, content, files, author) {
        try {
            const featureImage = {
                img: files[0].originalname,
                imgDesc: featureImageDescription
            }
            const slug = generateSlug(title);

            // Get new input fileds value for new model
            const post = new ForumModel({
                title,
                slug,
                shortDescription,
                keyWords,
                featureImage,
                categories,
                tags,
                description,
                content,
                author
            });

            return await post.save();
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    // Add updated post function and use new data that was added

    static async deletePostById(id) {
        try {
            const post = await ForumModel.findByIdAndDelete(id);

            if (!post) {
                ErrorHelper.throwNotFoundError('Objava');
            }

            return post;
        } catch (error) {
            ErrorHelper.throwServerError(error);

        }
    }

    static mapPosts(posts) {
        return posts.map((post) => ({
            ID: { value: post._id },
            Naziv: { value: post.title },
            Link: { value: post.slug },
            "Kratak Opis": { value: post.shortDescription },
            Slika: { 
                value: post.featureImage.img,
                Opis: { value: post.featureImage.imgDesc },
            },
            Kategorije: {
                value: post.categories.map(cat => ({
                    Naziv: cat.name,
                    Slug: cat.slug
                }))
            },
            Tagovi: {
                value: post.tags.map(tag => ({
                    Naziv: tag.name,
                    Slug: tag.slug
                }))
            },
        }))
    }

    static mapPostDetails(post) {
        return {
            ID: { value: post._id },
            Naziv: { value: post.title },
            Link: { value: post.slug },
            Autor: { value: post.author },
            Datum: { value: post.date.toLocaleDateString("sr-RS", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
            },
            Kategorije: {
                value: post.categories.map(cat => ({
                Naziv: cat.name,
                Slug: cat.slug
                }))
            },
            Tagovi: {
                value: post.tags.map(tag => ({
                Naziv: tag.name,
                Slug: tag.slug
                }))
            },
            "Ključne Reči": { value: post.keyWords },
            "Kratak Opis": { value: post.shortDescription },
            Slika: { 
                value: post.featureImage.img,
                Opis: { value: post.featureImage.imgDesc },
            },
            Opis: { value: post.description },
            Sadržaj: { value: post.content }
        }
    }
}

export default ForumService;