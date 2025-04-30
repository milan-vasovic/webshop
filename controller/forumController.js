import sanitize from 'mongo-sanitize';
import sanitizeHtml from 'sanitize-html';
import { validationResult } from 'express-validator';

import ForumService from '../service/forumService.js';

async function getForumPage(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const posts = await ForumService.findPosts(limit, page);
        const totalPages = Math.ceil(posts.totalPosts / limit);

        const categories = await ForumService.findPostsCategires();
        const tags = await ForumService.findPostsTags();

        return res.render('forum/forum', {
            path: "/forum",
            pageTitle: "Forum",
            pageDescription: "Forum, najnovije objave, informacije i saveti",
            pageKeyWords: "Forum, Objave, Informacije, Saveti",
            posts: posts,
            categories: categories,
            tags: tags,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/forum`,
            index: true,
            featureImage: undefined,
        });

    } catch (error) {
        next(error);
    }
}

async function getForumPageByCategory(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const category = req.params.category ? req.params.category : "";

        const posts = await ForumService.findPostsByCategory(category, limit, page);
        const totalPages = Math.ceil(posts.totalPosts / limit);
        const tags = await ForumService.findPostsTags(category);

        return res.render('forum/forum', {
            path: `/forum/kategorija/${category}`,
            pageTitle: "Forum Kategorija: " + category,
            pageDescription: "Forum, najnovije objave, informacije i saveti",
            pageKeyWords: "Forum, Objave, Informacije, Saveti",
            posts: posts,
            categories: [],
            tags: tags,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/forum/kategorija/${category}`,
            index: true,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
    
}

async function getForumPageByTags(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const tag = req.params.tag ? req.params.tag : "";

        const posts = await ForumService.findPostsByTags(tag, limit, page);
        const totalPages = Math.ceil(posts.totalPosts / limit);
        const categories = await ForumService.findPostsCategires(tag);


        return res.render('forum/forum', {
            path: `/forum/oznaka/${tag}`,
            pageTitle: "Forum Oznaka: " + tag,
            pageDescription: "Forum, najnovije objave, informacije i saveti",
            pageKeyWords: "Forum, Objave, Informacije, Saveti",
            posts: posts,
            categories: categories,
            tags: [],
            currentPage: page,
            totalPages: totalPages,
            basePath: `/forum/oznaka/${tag}`,
            index: true,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }   
}

async function getSearchForumsPage(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const search = req.params.search ? req.params.search : "";
        const searchSanitized = sanitize(search);
        const posts = await ForumService.findPostsBySearch(searchSanitized, limit, page);
        const totalPages = Math.ceil(posts.totalPosts / limit);

        return res.render('forum/forum', {
            path: `/forum/pretraga/${search}`,
            pageTitle: "Forum Pretraga: " + search,
            pageDescription: "Forum, najnovije objave, informacije i saveti",
            pageKeyWords: "Forum, Objave, Informacije, Saveti",
            posts: posts,
            categories: [],
            tags: [],
            currentPage: page,
            totalPages: totalPages,
            basePath: `/forum/pretraga/${search}`,
            index: true,
            featureImage: undefined,
        });
    } catch (error) {
        next(error)
    }
}

async function getForumPostDetailsPage(req, res, next) {
    try {
        const postTitle = req.params.postTitle;
        const post = await ForumService.findPostByName(postTitle);

        return res.render('forum/post', {
            path: `/forum/objava/${post.Naziv.value}`,
            pageTitle: post.Naziv.value,
            pageDescription: post["Kratak Opis"].value,
            pageKeyWords: post["Ključne Reči"].value,
            post: post,
            index: true,
            featureImage: post["Slika"].value,
        });
    } catch (error) {
        next(error);
    }
}

async function getAdminForumPage(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const posts = await ForumService.findPosts(limit, page);
        const totalPages = Math.ceil(posts.totalPosts / limit);

        return res.render('admin/forum/posts', {
            path: "/admin/objave",
            pageTitle: "Objave",
            pageDescription: "Admin panel - Forum",
            pageKeyWords: "Admin, Forum",
            posts: posts,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/objave`,
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}

async function getAdminSearchForumsPage(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const search = req.params.search ? req.params.search : "";
        const searchSanitized = sanitize(search);
        const posts = await ForumService.findPostsBySearch(searchSanitized, limit, page);
        const totalPages = Math.ceil(posts.totalPosts / limit);
        
        return res.render('admin/forum/posts', {
            path: `/admin/objave/pretraga/${search}`,
            pageTitle: "Objave Pretraga: " + search,
            pageDescription: "Admin panel - Forum",
            pageKeyWords: "Admin, Forum",
            posts: posts,
            currentPage: page,
            totalPages: totalPages,
            basePath: `/admin/objave/pretraga/${search}`,
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}
async function getAdminForumPostDetailsPage(req, res, next) {
    try {
        const postId = req.params.postId;

        const post = await ForumService.findPostById(postId);

        return res.status(200).render('admin/forum/post-details', {
            path: "/admin/objava-detalji/" + post.Naziv.value,
            pageTitle: post.Naziv.value,
            pageDescription: post["Kratak Opis"].value,
            pageKeyWords: post["Ključne Reči"].value,
            post: post,
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}

async function getAddForumPostPage(req, res, next) {
    try {
        return res.render('admin/forum/add-post', {
            path: "/admin/dodaj-objavu",
            pageTitle: "Dodaj Objavu",
            pageDescription: "Admin panel - Dodaj Objavu",
            pageKeyWords: "Admin, Dodaj Objavu",
            existingData: null,
            errorMessage: "",
            index: false,
            featureImage: undefined,
        });
    } catch (error) {
        next(error);
    }
}

async function postAddPost(req, res, next) {
    try {
        const userId = req.session.user._id;

        const title = sanitize(req.body.title);
        const shortDescription = sanitizeHtml(req.body.shortDescription);
        const keyWords = sanitize(req.body.keyWords);
        const featureImageDescription = sanitize(req.body.featureImageDesc);
        const categories = sanitize(req.body.categories);
        const tags = sanitize(req.body.tags);
        const description = sanitizeHtml(req.body.description)
        const content = req.body.content.map((content) => sanitizeHtml(content));
        const files = req.files;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).render('admin/forum/add-post', {
                path: "/admin/dodaj-objavu",
                pageTitle: "Dodaj Objavu",
                pageDescription: "Admin panel - Dodaj Objavu",
                pageKeyWords: "Admin, Dodaj Objavu",
                existingData: {
                    title: title,
                    shortDescription: shortDescription,
                    keyWords: keyWords,
                    featureImageDescription: featureImageDescription,
                    categories: categories,
                    tags: tags,
                    description: description,
                    content: content
                },
                errorMessage: errors.array()[0].msg,
                index: false,
                featureImage: undefined,
            });
        }

        const post = await ForumService.createPost(title, shortDescription, keyWords, featureImageDescription, categories, tags, description, content, files, userId);

        return res.redirect('/admin/objave');
    } catch (error) {
        console.error(error);
        next(error);
    }
}

async function postEditPost(req, res, next) {
    try {
        return res.status(200);
    } catch (error) {
        next(error);
    }
}

async function postSearchPost(req, res, next) {
    try {
        const search = sanitize(req.body.search);

        if (!search) {
            return res.redirect("/forum");
        }

        return res.redirect(`/forum/pretraga/${search}`);
    } catch (error) {
        next(error);
    }
}

async function postAdminSearchPost(req, res, next) {
    try {
        const search = sanitize(req.body.search);

        if (!search) {
            return res.redirect("/admin/objave");
        }

        return res.redirect(`/admin/objave/pretraga/${search}`);
    } catch (error) {
        next(error);
    }
}

async function deletePostById(req, res, next) {
    try {
        const postId = req.body.itemId;
        const post = await ForumService.deletePostById(postId);
        
        if (post) {
            return res.status(200).redirect('/admin/objave');
        }
    } catch (error) {
        next(error);
    }
}

export default {
    getForumPage,
    getForumPageByCategory,
    getForumPageByTags,
    getSearchForumsPage,
    getForumPostDetailsPage,
    getAdminForumPage,
    getAdminSearchForumsPage,
    getAdminForumPostDetailsPage,
    getAddForumPostPage,
    postAddPost,
    postEditPost,
    postSearchPost,
    postAdminSearchPost,
    deletePostById
}