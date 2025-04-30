import ForumModel from '../model/forum.js';

import ErrorHelper from '../helper/errorHelper.js';

class ForumService {
    static async findPosts(limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;
            const posts = await ForumModel.find().sort({ _id: 1}).skip(skip).limit(limit).exec();

            if (!posts) {
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
            const post = await ForumModel.findById(id);

            if (!post) {
                ErrorHelper.throwNotFoundError('Objava');
            }

            return this.mapPostDetails(post);

        } catch (error) {
            ErrorHelper.throwServerError(error);
            
        }
    }

    static async findPostByName(name) {
        try {
            const post = await ForumModel.findOne({ title: name });

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
            const filter = { categories: category };

            const posts = await ForumModel.find(filter)
                .sort({ _id: 1  })
                .skip(skip)
                .limit(limit)
                .lean();

            if (!posts) {
                ErrorHelper.throwNotFoundError('Objava');
            }

            const postCount = await ForumModel.find(filter).countDocuments();

            return {
                posts: ForumService.mapPosts(posts),
                totalPosts: postCount,
            }
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findPostsByTags(tag, limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;
            const filter = { tags: tag };

            const posts = await ForumModel.find(filter)
                .sort({ _id: 1  })
                .skip(skip)
                .limit(limit)
                .lean();

            if (!posts) {
                ErrorHelper.throwNotFoundError('Objava');
            }

            const postCount = await ForumModel.find(filter).countDocuments();

            return {
                posts: ForumService.mapPosts(posts),
                totalPosts: postCount,
            }
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findPostsBySearch(search, limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;
            let filter = {};

            if (search) {
                let conditions = [
                    { title: { $regex: search, $options: "i" } },
                    { categories: { $regex: search, $options: "i" } },
                    { tags: { $regex: search, $options: "i" } },
                    { keyWords: { $regex: search, $options: "i" } },
                ];

                filter = { $or: conditions };
            }

            const posts = await ForumModel.find(filter)
                  .sort({ _id: 1  })
                  .skip(skip)
                  .limit(limit)
                  .lean();
            
            if (!posts) {
                ErrorHelper.throwNotFoundError("Objave");
            }
            
            const postCount = await ForumModel.find(filter).countDocuments();
            
            return {
                posts: ForumService.mapPosts(posts),
                totalPosts: postCount
            };
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findPostsCategires(tags = null) {
        try {
            let filter = {};
            if (tags) {
                filter = { tags: tags };
            }

            const categories = await ForumModel.find(filter).distinct('categories').exec();

            if (!categories) {
                ErrorHelper.throwNotFoundError('Categories not found');
            }

            return categories;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }
    
    static async findPostsTags(category = null) {
        try {
            let filter = {};
            if (category) {
                filter = { categories: category };
            }

            const tags = await ForumModel.find(filter).distinct('tags').exec();

            if (!tags) {
                ErrorHelper.throwNotFoundError('Tags not found');
            }
            
            return tags;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async createPost(title, shortDescription, keyWords, featureImageDescription, categories, tags, description, content, files, author) {
        try {
            console.log(files)
            const featureImage = {
                img: files[0].originalname,
                imgDesc: featureImageDescription
            }
            
            const post = new ForumModel({
                title,
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
            "Kratak Opis": { value: post.shortDescription },
            Slika: { 
                value: post.featureImage.img,
                Opis: { value: post.featureImage.imgDesc },
            }
        }))
    }

    static mapPostDetails(post) {
        return {
            ID: { value: post._id },
            Naziv: { value: post.title },
            Autor: { value: post.author },
            Datum: { value: post.date.toLocaleDateString("sr-RS", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
            },
            Kategorije: { value: post.categories },
            Tagovi: { value: post.tags },
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