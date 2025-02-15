import { Router } from "express";

const router = Router();

import ForumController from '../controller/forumController.js';

router.get("/forum", ForumController.getForumPage);

router.get('/forum/kategorija/:category', ForumController.getForumPageByCategory);

router.get("/forum/tagovi/:tag", ForumController.getForumPageByTag);

router.get("/forum/pretraga/:search", ForumController.getForumPageBySearch);

router.get("/objava/:postId", ForumController.getPostPage);

export default router;