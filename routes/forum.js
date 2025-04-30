import { Router } from "express";

import ForumController from '../controller/forumController.js';

const router = Router();

router.get("/forum", ForumController.getForumPage);

router.get('/forum/kategorija/:category', ForumController.getForumPageByCategory);

router.get("/forum/oznaka/:tag", ForumController.getForumPageByTags);

router.get("/forum/pretraga/:search", ForumController.getSearchForumsPage);

router.get("/objava/:postTitle", ForumController.getForumPostDetailsPage);

router.post("/forum/pretraga", ForumController.postSearchPost);

export default router;