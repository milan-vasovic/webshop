import ForumModel from '../model/forum.js';

import ErrorHelper from '../helper/errorHelper.js';

class ForumService {
    static async findPosts(search, limit = 10, skip = null) {
        try {
            let query = {};
            if (search) {
                query = {
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { content: { $regex: search, $options: 'i' } }
                    ]
                };
            }
            const forums = await ForumModel.find(query).limit(limit).skip(skip).exec();
            return this.mapPosts(forums);
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

    static async findPostsCategires() {
        try {
            const categories = await ForumModel.distinct('categories').exec();

            if (!categories) {
                ErrorHelper.throwNotFoundError('Categories not found');
            }

            return categories;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }
    
    static async findPostsTags() {
        try {
            const tags = await ForumModel.distinct('tags').exec();

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
            const featureImage = {
                img: files.featureImage[0].originalname,
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

    static mapPosts(posts) {
        return posts.map((post) => ({
            ID: { value: post._id },
            Naziv: { value: post.title },
            Autor: { value: post.author },
            Datum: { value: post.date.toLocaleDateString("sr-RS", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
            },
            Kategorija: { value: post.categories },
            Tagovi: { value: post.tags },
            "Ključne Reči": { value: post.keyWords },
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