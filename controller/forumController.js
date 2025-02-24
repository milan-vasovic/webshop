import sanitize from 'mongo-sanitize';
import sanitizeHtml from 'sanitize-html';
import { validationResult } from 'express-validator';

import ForumService from '../service/forumService.js';

async function getForumPage(req, res, next) {
    try {
        const search = req.query.search;
        let posts;

        if (search) {
            posts = await ForumService.findPosts(search);
        } else {
            posts = await ForumService.findPosts();
        }

        const categories = await ForumService.findPostsCategires();
        const tags = await ForumService.findPostsTags();

        return res.render('forum/forum', {
            path: "/forum",
            pageTitle: "Forum",
            pageDescription: "Forum, najnovije objave, informacije i saveti",
            pageKeywords: "Forum, Objave, Informacije, Saveti",
            posts: posts,
            categories: categories,
            tags: tags
        });

    } catch (error) {
        next(error);
    }
}

async function getForumPageByCategory(req, res, next) {
    try {
        return res.status(200);
    } catch (error) {
        next(error);
    }
    
}

async function getForumPageByTags(req, res, next) {
    try {
        return res.status(200);
    } catch (error) {
        next(error);
    }
    
}

async function getForumPostDetailsPage(req, res, next) {
    try {
        const postTitle = req.params.postTitle;
        const post = await ForumService.findPostByName(postTitle);

        return res.render('forum/post', {
            path: "/forum/objava",
            pageTitle: post.Naziv.value,
            pageDescription: post["Kratak Opis"].value,
            pageKeywords: post["Ključne Reči"].value,
            post: post
        });
    } catch (error) {
        next(error);
    }
}

async function getAdminForumPage(req, res, next) {
    try {
        const search = req.query.search;
        let posts;

        if (search) {
            posts = await ForumService.findPosts(search);
        } else {
            posts = await ForumService.findPosts();
        }

        return res.render('admin/forum/posts', {
            path: "/admin/objave",
            pageTitle: "Objave",
            pageDescription: "Admin panel - Forum",
            pageKeywords: "Admin, Forum",
            posts: posts
        });
    } catch (error) {
        next(error);
    }
}

async function getAdminForumPostDetailsPage(req, res, next) {
    try {
        return res.status(200);
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
            pageKeywords: "Admin, Dodaj Objavu",
            existingData: null,
            errorMessage: ""
        });
    } catch (error) {
        next(error);
    }
}

async function getEditCouponPage(req, res, next) {
    try {
        return res.status(200);
    } catch (error) {
        next(error);
    }
}

async function postAddtPost(req, res, next) {
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
                pageKeywords: "Admin, Dodaj Objavu",
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
                errorMessage: errors.array()[0].msg
            });
        }

        const post = await ForumService.createPost(title, shortDescription, keyWords, featureImageDescription, categories, tags, description, content, files, userId);

        return res.redirect('/admin/objave');
    } catch (error) {
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
        return res.status(200);
    } catch (error) {
        next(error);
    }
}

async function deletePost(req, res, next) {
    try {
        return res.status(200);
    } catch (error) {
        next(error);
    }
}

export default {
    getForumPage,
    getForumPageByCategory,
    getForumPageByTags,
    getForumPostDetailsPage,
    getAdminForumPage,
    getAdminForumPostDetailsPage,
    getAddForumPostPage,
    getEditCouponPage,
    postAddtPost,
    postEditPost,
    postSearchPost,
    deletePost
}