import { ObjectId } from "mongodb";
import sanitize from "mongo-sanitize";
import { generateSlug } from "../helper/slugHelper.js";
import mongoose from "mongoose";
import ItemModel from "../model/item.js";

import ErrorHelper from "../helper/errorHelper.js";
import EmailService from "./emailService.js";
import CategoriesService from "./categoriesService.js";
import TagService from "./tagService.js";

class ItemService {

  static async findItemsForAdminSelection({ includeCategories = true, categoryIds = [], excludeItemId = null }) {
    const query = {};

    if (categoryIds.length > 0) {
      const objectIds = categoryIds.map(id => new mongoose.Types.ObjectId(id));

      if (includeCategories) {
        query.categories = { $in: objectIds };
      } else {
        query.categories = { $nin: objectIds };
      }
    }

    if (excludeItemId && mongoose.Types.ObjectId.isValid(excludeItemId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeItemId) };
    }

    const items = await ItemModel.find(query).select("title").lean();

    if (!items || items.length === 0) {
      return ErrorHelper.throwNotFoundError("Artikli");
    }

    return items.map((item) => ({
      ID: { value: item._id },
      Naziv: { value: item.title }
    }));
  }

  static async findAllCategories() {
    const categories = await CategoriesService.findAllCategoriesForItems();

    return {  
      Kategorije: categories.map((category) => ({
        ID: category._id ,
        Naziv: category.name,
        Slug: category.slug
      }))
    };
  }

  static async findAllTags() {
    const tags = await TagService.findAllTagsForItems()

    return {
      Tagovi: tags.map((tag) => ({
        Naziv: tag.name,
        Tip: tag.kind,
        Vrsta: tag.type,
        Slug: tag.slug,
      })),
    };
  }  

  static async findAllItems(limit = 10, skip = 0) {
    const items = await ItemModel.find()
      .sort({ soldCount: -1, _id: 1  })
      .select(
        "title slug shortDescription price actionPrice categories tags featureImage status"
      )
      .populate('categories')
      .populate('tags')
      .skip(skip)
      .limit(limit)
      .lean();

    if (!items) {
      ErrorHelper.throwNotFoundError("Artikli");
    }

    return ItemService.mapItemsForCard(items);
  }

  static async findFeaturedItems(category = null, tag = null, limit = 10, skip = 0) {
    const filter = { 
      status: { 
        $in: ["featured"],
        $nin: ["not-published"]
      }
    };

    if (category) {
      let slugs = [];
      try {
        slugs = slugs.map((c) => {
          if (typeof c === "string") return c;
          if (typeof c === "object" && c.Slug) return c.Slug;
          return "";
        }).filter(Boolean);
      } catch (err) {
        slugs = [category];
      }

      const categoryDocs = await CategoriesService.findCategoriesBySlugs(slugs, { returnIdsOnly: true });

      const categoryIds = categoryDocs.map((cat) => cat._id);
      filter.categories = { $in: categoryIds };
    }

    if (tag) {
      let slugs = [];
      try {
        slugs = slugs.map((t) => {
          if (typeof t === "string") return t;
          if (typeof t === "object" && t.Slug) return t.Slug;
          return "";
        }).filter(Boolean);
      } catch (err) {
        slugs = [tag];
      }

      const tagDocs = await TagService.findTagsBySlugs(slugs, { returnIdsOnly: true });

      const tagIds = tagDocs.map((tag) => tag._id);
      filter.tags = { $in: tagIds };
    }

    const items = await ItemModel.find(filter)
      .sort({ soldCount: -1, _id: 1  })
      .select(
        "title slug shortDescription categories tags price actionPrice featureImage status"
      )
      .populate('categories tags')
      .skip(skip)
      .limit(limit)
      .lean();

    return items ? ItemService.mapItemsForShop(items) : [];
  }

  static async findActionItems(category = null, tag = null, limit = 10, skip = 0) {
    const filter = {
      status: {
        $in: ["action"],
        $nin: ["not-published"]
      }
    };    

    if (category) {
      let slugs = [];
      try {
        slugs = slugs.map((c) => {
          if (typeof c === "string") return c;
          if (typeof c === "object" && c.Slug) return c.Slug;
          return "";
        }).filter(Boolean);
      } catch (err) {
        slugs = [category];
      }

      const categoryDocs = await CategoriesService.findCategoriesBySlugs(slugs, { returnIdsOnly: true });

      const categoryIds = categoryDocs.map((cat) => cat._id);
      filter.categories = { $in: categoryIds };
    }

    if (tag) {
      let slugs = [];
      try {
        slugs = slugs.map((t) => {
          if (typeof t === "string") return t;
          if (typeof t === "object" && t.Slug) return t.Slug;
          return "";
        }).filter(Boolean);
      } catch (err) {
        slugs = [tag];
      }

      const tagDocs = await TagService.findTagsBySlugs(slugs, { returnIdsOnly: true });

      const tagIds = tagDocs.map((tag) => tag._id);
      filter.tags = { $in: tagIds };
    }

    const items = await ItemModel.find(filter)
      .sort({ soldCount: -1, _id: 1  })
      .select(
        "title slug shortDescription categories tags price actionPrice featureImage status"
      )
      .populate('categories')      
      .skip(skip)
      .limit(limit)
      .lean();

    if (!items) {
      ErrorHelper.throwNotFoundError("Akcijski Artikli");
    }

    return ItemService.mapItemsForShop(items);
  }

  static async findItemsByCategory(category, status = null, excludeStatus = null, limit = 10, skip = 0) {
    const filter = {};
    let slugs = [];

    try {
      slugs = Array.isArray(category) ? category : category.split(",").map(c => c.trim());
    } catch {
      slugs = [category];
    }

    slugs = slugs.map((c) => (typeof c === "object" && c.Slug ? c.Slug : c)).filter(Boolean);

    const categoryIds = await CategoriesService.findCategoriesBySlugs(slugs, { returnIdsOnly: true });

    if (!categoryIds.length) {
      return { items: [], totalCount: 0 };
    }

    filter.categories = { $in: categoryIds };

    const excluded = new Set(["not-published"]);
    if (excludeStatus) (Array.isArray(excludeStatus) ? excludeStatus : [excludeStatus]).forEach(e => excluded.add(e));

    filter.status = status
      ? { $in: Array.isArray(status) ? status : [status], $nin: Array.from(excluded) }
      : { $nin: Array.from(excluded) };

    const [items, itemCount] = await Promise.all([
      ItemModel.find(filter)
        .sort({ soldCount: -1, _id: 1 })
        .select("title slug shortDescription price actionPrice categories tags featureImage status")
        .populate("categories tags")
        .skip(skip)
        .limit(limit)
        .lean(),
      ItemModel.countDocuments(filter)
    ]);

    const metadataCategory = (await CategoriesService.findCategoriesBySlugs(slugs))[0];

    return {
      items: ItemService.mapItemsForShop(items),
      totalCount: itemCount,
      metadata: {
        title: metadataCategory?.name || "",
        description: metadataCategory?.shortDescription || "",
        longDescription: metadataCategory?.longDescription || ""
      }
    };
  }
  
  static async findItemsByTag(tag, status = null, excludeStatus = null, limit = 10, skip = 0) {
    const filter = {};
    let slugs = [];

    try {
      slugs = Array.isArray(tag) ? tag : tag.split(",").map(t => t.trim());
    } catch {
      slugs = [tag];
    }

    slugs = slugs.map((t) => (typeof t === "object" && t.Slug ? t.Slug : t)).filter(Boolean);

    const tagIds = await TagService.findTagsBySlugs(slugs, { returnIdsOnly: true });

    if (!tagIds.length) {
      return { items: [], totalCount: 0 };
    }

    filter.tags = { $in: tagIds };

    const excluded = new Set(["not-published"]);
    if (excludeStatus) (Array.isArray(excludeStatus) ? excludeStatus : [excludeStatus]).forEach(e => excluded.add(e));

    filter.status = status
      ? { $in: Array.isArray(status) ? status : [status], $nin: Array.from(excluded) }
      : { $nin: Array.from(excluded) };

    const [items, itemCount] = await Promise.all([
      ItemModel.find(filter)
        .sort({ soldCount: -1, _id: 1 })
        .select("title slug shortDescription price actionPrice tags categories featureImage status")
        .populate("tags categories")
        .skip(skip)
        .limit(limit)
        .lean(),
      ItemModel.countDocuments(filter)
    ]);

    const metadataTag = (await TagService.findTagsBySlugs(slugs))[0];

    return {
      items: ItemService.mapItemsForShop(items),
      totalCount: itemCount,
      metadata: {
        title: metadataTag?.name || "",
        description: metadataTag?.shortDescription || "",
        longDescription: metadataTag?.longDescription || ""
      }
    };
  }

  static async findItemsBySearch(search, limit = 10, page = 1, cond = false) {
    const skip = (page - 1) * limit;
    const filter = {};

    const searchRegex = new RegExp(search, "i");
    const andConditions = [];

    if (!cond) {
      andConditions.push({ status: { $ne: "not-published" } });
    }

    const orTextConditions = [];

    if (search) {
      orTextConditions.push({ title: { $regex: searchRegex } });
      orTextConditions.push({ slug: { $regex: searchRegex } });
      orTextConditions.push({ sku: { $regex: searchRegex } });
      orTextConditions.push({ keyWords: { $regex: searchRegex } });

      const numberValue = parseFloat(search);
      if (!isNaN(numberValue)) {
        orTextConditions.push({ price: numberValue });
        orTextConditions.push({ actionPrice: numberValue });
      }

      if (orTextConditions.length > 0) {
        andConditions.push({ $or: orTextConditions });
      }

      // Kategorije i tagovi
      const categoryIds = await CategoriesService.searchCategoryIdsByTerm(search);
      if (categoryIds.length > 0) {
        andConditions.push({ categories: { $in: categoryIds } });
      }

      const tagIds = await TagService.searchTagIdsByTerm(search);
      if (tagIds.length > 0) {
        andConditions.push({ tags: { $in: tagIds } });
      }
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const [items, itemCount] = await Promise.all([
      ItemModel.find(filter)
        .sort({ soldCount: -1, _id: 1 })
        .select("title slug shortDescription price actionPrice status categories tags keyWords featureImage")
        .populate("categories")
        .populate("tags")
        .skip(skip)
        .limit(limit)
        .lean(),
      ItemModel.countDocuments(filter)
    ]);

    if (!items || items.length === 0) {
      ErrorHelper.throwNotFoundError("Artikli");
    }

    // Metadata
    let metadata = null;
    const foundCategory = await CategoriesService.findCategoryBySlug(search);
    if (foundCategory) {
      metadata = {
        title: foundCategory.name,
        description: foundCategory.shortDescription,
        longDescription: foundCategory.longDescription
      };
    }

    const foundTag = await TagService.findTagBySlug(search);
    if (foundTag) {
      metadata = {
        title: foundTag.name,
        description: foundTag.shortDescription,
        longDescription: foundTag.longDescription
      };
    }

    return {
      items: ItemService.mapItemsForCard(items),
      totalCount: itemCount,
      metadata
    };
  }

  static async findItemDetailsByIdOrSlug(id, itemSlug = null) {
    if (itemSlug) {
      const item = await ItemModel.findOne({ slug: itemSlug }).select(
        "title slug keyWords shortDescription price actionPrice description categories tags featureImage video status backorder variations upSellItems crossSellItems wishlist"
      )
      .populate("categories tags");

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }

      return ItemService.mapItemDetails(item);
    }

    const item = await ItemModel.findById(id).select(
      "title slug keyWords shortDescription price actionPrice description categories tags featureImage video status backorder variations upSellItems crossSellItems"
    )
    .populate("categories tags");

    if (!item) {
      ErrorHelper.throwNotFoundError("Artikal");
    }

    return ItemService.mapItemDetails(item);
  }

  static async findAdminItems(limit = 10, page = 1) {
    const skip = (page - 1) * limit;

    const items = await ItemModel.find()
      .sort({ soldCount: -1, _id: 1 })
      .select(
        "title slug shortDescription price actionPrice categories tags status sku featureImage"
      )
      .populate("categories")
      .populate("tags")
      .skip(skip)
      .limit(limit)
      .lean();

    if (!items) {
      ErrorHelper.throwNotFoundError("Artikli");
    }

    const itemCount = await ItemModel.find().countDocuments();

    return {
      items: ItemService.mapItemsForCardForAdmin(items),
      totalCount: itemCount
    }
  }

  static async findItemDetailsByIdForAdmin(id) {
    const item = await ItemModel.findById(id).populate("categories tags");

    if (!item) {
      ErrorHelper.throwNotFoundError("Artikal");
    }

    return ItemService.mapItemDetailsForAdmin(item);
  }

  static async findItemForCart(itemId, variationId, amount, code = null) {
    try {
      const item = await ItemModel.findById(itemId);

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }

      const variation = item.variations.find(
        (v) => v._id.toString() === variationId.toString()
      );

      if (!variation) {
        ErrorHelper.throwNotFoundError("Varijacija");
      }

      let itemPrice;

      if (item.status?.includes("action") && variation.onAction) {
        itemPrice = item.actionPrice;
      } else {
        itemPrice = item.price;
      }

      const result = {
        _id: new ObjectId(),
        itemId: item._id,
        variationId: variationId,
        itemName: item.title,
        itemImg: item.featureImage.img,
        size: variation.size,
        color: variation.color,
        amount: amount,
        price: Number(itemPrice * amount),
        code: code,
      };

      return result;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findItemDetailsForUpCrossSell(itemId) {
    try {
      const item = await ItemModel.findById(itemId).select(
        "title slug shortDescription featureImage"
      );

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }

      return item;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findUsersFromItemWishlist(itemId) {
    try {
      const item = await ItemModel.findById(itemId)
        .select("name whislist")
        .populate('wishlist.userId', "firstName email");

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }


      return item;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }
  
  static async addUserToItemWishlist(userId, itemId) {
    try {
      const item = await ItemModel.findById(itemId)
        .select("title wishlist");

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }

      const hasUser = item.wishlist.some(wish => wish.userId.toString() === userId.toString());
    
      if (!hasUser) {
        item.wishlist.push({userId: userId});
        return await item.save();
      }

      return item;

    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async removeUserFromItemWishlist(userId, itemId) {
    try {
      const item = await ItemModel.findById(itemId)
        .select("title wishlist");

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }
      
      const initialLength = item.wishlist.length;
      item.wishlist = item.wishlist.filter(wish => wish.userId.toString() !== userId.toString());
      
      if (item.wishlist.length !== initialLength) {
        await item.save();
      }
      
      return item;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }
  
  static async createNewItem(body, files) {
    const featureImageFile = files.find(file => file.fieldname === 'featureImage');
    const featureImage = {
      img: featureImageFile ? featureImageFile.originalname : null,
      imgDesc: sanitize(body.featureImageDesc || ""),
    };

    const slug = generateSlug(body.title);

    const variationImages = files.filter(file => file.fieldname.startsWith('variationImage'));
    const variations = [];

    if (body.variations) {
      body.variations.forEach((variation, index) => {
        const variationImageFile = variationImages[index] || null;
        variations.push({
          size: sanitize(variation.size),
          color: sanitize(variation.color),
          amount: Number(sanitize(variation.amount)),
          image: {
            img: variationImageFile ? variationImageFile.originalname : null,
            imgDesc: sanitize(variation.imgDesc || ""),
          },
          onAction: sanitize(variation.onAction) === "true",
        });
      });
    }

    const upSellItems = sanitize(body.upSellItems || []);
    const upSellDetails = await Promise.all(
      upSellItems.map(async id => {
        const item = await this.findItemDetailsForUpCrossSell(id);
        return {
          itemId: item._id,
          title: item.title,
          shortDescription: item.shortDescription,
          featureImage: item.featureImage,
        };
      })
    );

    const crossSellItems = sanitize(body.crossSellItems || []);
    const crossSellDetails = await Promise.all(
      crossSellItems.map(async id => {
        const item = await this.findItemDetailsForUpCrossSell(id);
        return {
          itemId: item._id,
          title: item.title,
          shortDescription: item.shortDescription,
          featureImage: item.featureImage,
        };
      })
    );

    const categoryIds = Array.isArray(body.categories)
      ? body.categories.map(id => sanitize(id))
      : [sanitize(body.categories)];

    const tagIds = Array.isArray(body.tags)
      ? body.tags.map(id => sanitize(id))
      : [sanitize(body.tags)];

    const newItemData = {
      title: sanitize(body.title),
      slug,
      sku: sanitize(body.sku),
      price: Number(sanitize(body.price)),
      actionPrice: Number(sanitize(body.actionPrice)),
      shortDescription: sanitize(body.shortDescription),
      description: sanitize(body.description),
      keyWords: sanitize(body.keyWords || []),
      categories: categoryIds,
      tags: tagIds,
      status: Array.isArray(body.status) ? body.status : [body.status],
      backorder: { isAllowed: sanitize(body.backorderAllowed === "on") },
      variations,
      featureImage,
      upSellItems: upSellDetails,
      crossSellItems: crossSellDetails,
    };

    const videoFile = files.find(file => file.fieldname === 'video');
    if (videoFile) {
      newItemData.video = {
        vid: videoFile.originalname,
        vidDesc: sanitize(body.videoDesc || null),
      };
    }

    const newItem = new ItemModel(newItemData);
    return await newItem.save();
  }

  static async updateItem(itemId, body, files) {
    const existingItem = await ItemModel.findById(itemId);
    if (!existingItem) {
      ErrorHelper.throwNotFoundError("Artikal");
    }

    const slug = generateSlug(body.title);

    const featureImageFile = files.find(file => file.fieldname === 'featureImage');
    if (featureImageFile) {
      existingItem.featureImage = {
        img: featureImageFile.originalname,
        imgDesc: sanitize(body.featureImageDesc || ""),
      };
    }

    const videoFile = files.find(file => file.fieldname === 'video');
    if (videoFile) {
      existingItem.video = {
        vid: videoFile.originalname,
        vidDesc: sanitize(body.videoDesc || null),
      };
    }

    if (body.variations) {
      body.variations = body.variations.map(variation => {
        const isNew = variation._id?.startsWith("new-");
        const existingVar = !isNew
          ? existingItem.variations.find(v => v._id.toString() === variation._id)
          : null;

        const file = files.find(f => f.fieldname === `variationImage_${variation._id}`) || null;

        const varObj = {
          size: variation.size,
          color: variation.color,
          amount: Number(variation.amount) || (existingVar?.amount || 0),
          image: {
            img: file ? file.originalname : existingVar?.image?.img || "",
            imgDesc: variation.imgDesc || existingVar?.image?.imgDesc || "",
          },
          onAction: variation.onAction === "true",
        };

        if (!isNew) varObj._id = variation._id;
        return varObj;
      });
      existingItem.variations = body.variations;
    }

    existingItem.title = body.title || existingItem.title;
    existingItem.slug = slug || existingItem.slug;
    existingItem.sku = body.sku || existingItem.sku;
    existingItem.shortDescription = body.shortDescription || existingItem.shortDescription;
    existingItem.description = body.description || existingItem.description;
    existingItem.keyWords = body.keyWords || existingItem.keyWords;

    existingItem.categories = Array.isArray(body.categories)
      ? body.categories.map(id => sanitize(id))
      : [sanitize(body.categories)];

    existingItem.tags = Array.isArray(body.tags)
      ? body.tags.map(id => sanitize(id))
      : [sanitize(body.tags)];

    const newStatus = Array.isArray(body.status) ? body.status : [body.status];
    const existingStatus = Array.isArray(existingItem.status) ? existingItem.status : [existingItem.status];
    if (newStatus.includes("action") && !existingStatus.includes("action")) {
      await EmailService.notifyUsersFromItemWishlist(existingItem._id);
    }
    existingItem.status = newStatus;

    existingItem.price = Number(body.price);
    existingItem.actionPrice = Number(body.actionPrice);

    existingItem.upSellItems = body.upSellItems || [];
    existingItem.crossSellItems = body.crossSellItems || [];

    existingItem.backorder.isAllowed = body.backorderAllowed === "on";

    return await existingItem.save();
  }

  static async findUsersFromWishlist(itemId) {
    try {
      const item = await ItemModel.findById(itemId)
        .select("title wishlist")
        .populate("wishlist.userId", "firstName email");

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }

      return item;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async findUpCrossSellItems(itemId) {
    const item = await ItemModel.findById(itemId).select(
      "_id title shortDescription featureImage"
    );
    return item;
  }

  static async addBackorderToItem(itemId, variationId, amount, userId = null) {
    try {
      const item = await ItemModel.findById(itemId).select(
        "variations backorder"
      );

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }

      const variation = item.variations.find(
        (v) => v._id.toString() === variationId.toString()
      );

      if (userId) {
        item.backorder.orders.push({
          userId: userId,
          size: variation.size,
          color: variation.color,
          amount: amount,
        });
      } else {
        item.backorder.orders.push({
          size: variation.size,
          color: variation.color,
          amount: amount,
        });
      }

      return item.save();
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async updateItemAmountById(itemId, amount, variationId, session) {
    try {
      const item = await ItemModel.findById(itemId).select(
        "soldCount variations"
      );

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }
      const variationIndex = item.variations.findIndex(
        (variation) => variation._id.toString() === variationId.toString()
      );

      if (variationIndex > -1) {
        item.variations[variationIndex].amount -= amount;

        if (0 < item.variations[variationIndex].amount <= 3) {
          EmailService.sendItemLowInStock(item._id, item.variations[variationIndex]._id);
        } else if (item.variations[variationIndex].amount <= 0) {
          EmailService.sendItemOutOfStock(item.variations[variationIndex]._id);
        }
        
      } else {
        ErrorHelper.throwNotFoundError("Varijacija nije pronađena");
      }

      return await item.save({ session });
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async changeItemSoldCount(itemId, amount, session) {
    try {
      const updatedItem = await ItemModel.findByIdAndUpdate(
        itemId,
        { $inc: { soldCount: amount } },
        { new: true, session }
      );
      return updatedItem;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }
  
  static async changeItemReturnedCount(itemId, amount, session) {
    try {
      const updatedItem = await ItemModel.findByIdAndUpdate(
        itemId,
        { $inc: { returnedCount: amount } },
        { new: true, session }
      );
      return updatedItem;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async changeVariationAmount(itemId, size, color, amount, session) {
    try {
      const item = await ItemModel.findById(itemId)
        .select("variations");

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }

      const variation = item.variations.find(v => v.size === size && v.color === color);
      if (!variation) {
        ErrorHelper.throwNotFoundError("Varijacija");
      }

      variation.amount = (variation.amount || 0) + Number(amount);

      await item.save({ session });
      return item;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async detachItemReferences(itemId, session) {
    const item = await ItemModel.findById(itemId)
      .select("_id")
      .session(session);

    if (!item) {
      ErrorHelper.throwNotFoundError("Artikal nije pronađen");
    }

    await ItemModel.updateMany(
      { "upSellItems.itemId": item._id },
      { $pull: { upSellItems: { itemId: item._id } } },
      { session }
    );

    await ItemModel.updateMany(
      { "crossSellItems.itemId": item._id },
      { $pull: { crossSellItems: { itemId: item._id } } },
      { session }
    );

    return item;
  }

  static async removeCategoryFromItems(categoryId, session) {
    const filter = {
      categories: categoryId
    };

    const update = {
      $pull: { categories: categoryId }
    };

    const options = {};
    if (session) {
      options.session = session;
    }

    try {
      const result = await ItemModel.updateMany(filter, update, options);
      return result;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async removeTagFromItems(tagId, session) {
    const filter = {
      tags: tagId
    };

    const update = {
      $pull: { tags: tagId }
    };

    const options = {};
    if (session) {
      options.session = session;
    }

    try {
      const result = await ItemModel.updateMany(filter, update, options);
      return result;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static async deleteItemById(itemId, session) {
    try {
      const item = await ItemModel.findByIdAndDelete(itemId).session(session);

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  static mapItemsForShop(items) {
    return items.map((item) => ({
      ID: { value: item._id },
      Naziv: { value: item.title },
      Link: { value: item.slug },
      Opis: { value: item.shortDescription },
      Status: { value: item.status.join(", ") },
      Kategorije: {
        value: item.categories.map(cat => ({
          Naziv: cat.name,
          Slug: cat.slug
        }))
      },
      Tagovi: { value: item.tags },
      Slika: {
        value: item.featureImage.img,
        Opis: item.featureImage.imgDesc,
      },
      Cena: { value: item.price },
      "Akcijska Cena": { value: item.actionPrice },
    }));
  }

  static mapItemsForCard(items) {
    return items.map((item) => ({
      ID: { value: item._id },
      Naziv: { value: item.title },
      Link: { value: item.slug },
      Opis: { value: item.shortDescription },
      Status: { value: item.status.join(", ") },
      Kategorije: {
        value: item.categories.map(cat => ({
          Naziv: cat.name,
          Slug: cat.slug
        }))
      },
      Tagovi: {
        value: item.tags.map(tag => ({
          Naziv: tag.name,
          Slug: tag.slug
        }))
      },
      Slika: {
        value: item.featureImage.img,
        Opis: item.featureImage.imgDesc,
      },
      Cena: { value: item.price },
      "Akcijska Cena": { value: item.actionPrice },
    }));
  }

  static mapItemsForCardForAdmin(items) {
    return items.map((item) => ({
      ID: { value: item._id },
      Link: { value: item.slug },
      SKU: { value: item.sku },
      Naziv: { value: item.title },
      Status: { value: item.status.join(", ") },
      Kategorije: {
        value: item.categories.map(cat => cat.name).join(", ")
      },
      Tagovi: {
        value: item.tags.map(tag => tag.name).join(", ")
      },
      Slika: {
        value: item.featureImage.img,
        Opis: item.featureImage.imgDesc,
      },
      Cena: { value: item.price },
      "Akcijska Cena": { value: item.actionPrice },
    }));
  }

  static mapItemDetails(item) {
    const uniqueVariationImages = Array.from(
      new Map(
        item.variations
          .filter(v => v.image && v.image.img)
          .map(v => [v.image.img, { URL: v.image.img, Opis: v.image.imgDesc }])
      ).values()
    );
  
    return {
      ID: { value: item._id },
      Naziv: { value: item.title },
      Link: { value: item.slug },
      "Kratak Opis": { value: item.shortDescription },
      "Ključne Reči": { value: item.keyWords.join(", ") },
      Opis: { value: item.description },
      Cena: { value: item.price },
      "Akcijska Cena": { value: item.actionPrice },
      Slike: {
        "Istaknuta Slika": {
          URL: item.featureImage.img,
          Opis: item.featureImage.imgDesc,
        },
        Slike: uniqueVariationImages
      },
      Video: {
        URL: item.video?.vid || "",
        Opis: item.video?.vidDesc || "",
      },
      Kategorije: {
        value: item.categories.map(cat => ({
          Naziv: cat.name,
          Slug: cat.slug
        }))
      },
      Tagovi: {
        value: item.tags.map(tag => ({
          Naziv: tag.name,
          Slug: tag.slug
        }))
      },
      Status: { value: item.status },
      Backorder: {
        Dozvoljeno: item.backorder.isAllowed,
      },
      Varijacije: [...item.variations]
      .sort((a, b) => a.color.localeCompare(b.color)) // ili neka druga logika
      .map((variation) => ({
        ID: variation._id,
        Veličina: variation.size,
        Boja: variation.color,
        Količina: variation.amount,
        Slika: {
          URL: variation.image.img,
          Opis: variation.image.imgDesc,
        },
        Akcija: variation.onAction,
      })),
      "UpSell Artikli": item.upSellItems.map((upsell) => ({
        ID: { value: upsell.itemId },
        Naziv: { value: upsell.title },
        "Kratak Opis": { value: upsell.shortDescription },
        Slika: { value: upsell.featureImage },
      })),
      "CrossSell Artikli": item.crossSellItems.map((crosssell) => ({
        ID: { value: crosssell.itemId },
        Naziv: { value: crosssell.title },
        "Kratak Opis": { value: crosssell.shortDescription },
        Slika: { value: crosssell.featureImage },
      })),
      "Lista Želja": item.wishlist
    };
  }
  
  static mapItemDetailsForAdmin(item) {
    return {
      ID: { value: item._id },
      Naziv: { value: item.title },
      Link: { value: item.slug },
      SKU: { value: item.sku },
      "Kratak Opis": { value: item.shortDescription },
      "Ključne Reči": { value: item.keyWords.join(", ") },
      Cena: { value: item.price },
      "Akcijska Cena": { value: item.actionPrice },
      Opis: { value: item.description },
      Slike: {
        "Istaknuta Slika": {
          URL: item.featureImage.img,
          Opis: item.featureImage.imgDesc,
        },
        Slike: item.variations.map((variation) => ({
          URL: variation.image.img,
          Opis: variation.image.imgDesc,
        })),
      },
      Video: {
        URL: item.video?.vid || "",
        Opis: item.video?.vidDesc || "",
      },
      Kategorije: {
        value: item.categories.map(cat => ({
          ID: cat._id,
          Naziv: cat.name,
          Slug: cat.slug
        }))
      },
      Tagovi: {
        value: item.tags.map(tag => ({
          ID: tag._id,
          Naziv: tag.name,
          Slug: tag.slug
        }))
      },
      Status: { value: item.status.join(", ") },
      Backorder: {
        Dozvoljeno: item.backorder.isAllowed,
        Naručeno: item.backorder.orders.map((order) => ({
          Korisnik: order.userId,
          Veličina: order.size,
          Boja: order.color,
          Količina: order.amount,
        })),
      },
      Varijacije: item.variations.map((variation) => ({
        ID: variation._id,
        Veličina: variation.size,
        Boja: variation.color,
        Količina: variation.amount,
        Slika: {
          value: variation.image.img,
          Opis: variation.image.imgDesc,
        },
        Akcija: variation.onAction,
      })),
      "UpSell Artikli": item.upSellItems.map((upsell) => ({
        ID: upsell.itemId,
        Naziv: upsell.title,
        "Kratak Opis": upsell.shortDescription,
        Slika: upsell.featureImage,
      })),
      "CrossSell Artikli": item.crossSellItems.map((crosssell) => ({
        ID: crosssell.itemId,
        Naziv: crosssell.title,
        "Kratak Opis": crosssell.shortDescription,
        Slika: crosssell.featureImage,
      })),
      Partneri: item.partners.map((partner) => ({
        ID: partner.partnerId,
        Kod: partner.partnerCode,
      })),
      "Broj Prodatih": { value: item.soldCount },
      "Broj Vraćenih": { value: item.returnedCount },
    };
  }
}

export default ItemService;