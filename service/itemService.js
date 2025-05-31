import { ObjectId } from "mongodb";
import sanitize from "mongo-sanitize";
import { generateSlug } from "../helper/slugHelper.js";

import ItemModel from "../model/item.js";

import ErrorHelper from "../helper/errorHelper.js";
import EmailService from "./emailService.js";
import CategoryModel from "../model/category.js";
import TagModel from "../model/tag.js";

class ItemService {
  /**
   * Finds all admin add items based on category and itemId.
   *
   * @param {string|null} category - The category or categories to filter items by.
   * @param {string|null} itemId - The ID of the item to exclude from the results.
   * @returns {Promise<Array>} - A promise that resolves to an array of items.
   */
  static async findAllAdminAddItems(category = null, itemId = null) {
    let categorySlugs = [];
    if (category) {
      try {
        categorySlugs = category.split(",").map((c) => c.trim());
      } catch (err) {
        categorySlugs = [category];
      }
    }

    let categoryIds = [];
    if (categorySlugs.length > 0) {
      const foundCategories = await CategoryModel.find({
        slug: { $in: categorySlugs },
      }).select("_id");

      categoryIds = foundCategories.map((cat) => cat._id);
    }

    const query = {};

    if (categoryIds.length > 0) {
      query.categories = { $in: categoryIds };
    }

    if (itemId) {
      query._id = { $ne: itemId };
    }

    const items = await ItemModel.find(query).select("id title").exec();

    if (!items || items.length === 0) {
      return ErrorHelper.throwNotFoundError("Artikli");
    }

    return items.map((item) => ({
      ID: { value: item._id },
      Naziv: { value: item.title },
    }));
  }

  /**
   * Finds all admin add items based on category and itemId.
   *
   * @param {string|null} category - The category or categories to filter items by.
   * @param {string|null} itemId - The ID of the item to exclude from the results.
   * @returns {Promise<Array>} - A promise that resolves to an array of items.
   */
  static async findAllAdminAddItemsByCategory(category, itemId) {
    let categorySlugs = [];

    try {
      categorySlugs = category.split(",").map((c) => c.trim());
    } catch (err) {
      categorySlugs = [category];
    }

    // Pronađi ID-jeve kategorija na osnovu slugova
    const foundCategories = await CategoryModel.find({
      slug: { $in: categorySlugs },
    }).select("_id");

    const categoryIds = foundCategories.map((cat) => cat._id);

    const items = await ItemModel.find({
      categories: { $nin: categoryIds },
      _id: { $ne: itemId },
    })
      .select("id title")
      .exec();

    if (!items || items.length === 0) {
      return ErrorHelper.throwNotFoundError("Artikli");
    }

    return items.map((item) => ({
      ID: { value: item._id },
      Naziv: { value: item.title },
    }));
  }

  /**
   * Finds all categories.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of categories.
   */
  static async findAllCategories() {
    const categories = await CategoryModel.find()
      .select("name slug")
      .lean();

    return {
      Kategorije: categories.map((cat) => ({
        Naziv: cat.name,
        Slug: cat.slug,
      })),
    };
  }
  

  /**
   * Finds all tags.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of tags.
   */
  static async findAllTags() {
    const tags = await TagModel.find()
      .select("name slug")
      .lean();

    return {
      Tagovi: tags.map((tag) => ({
        Naziv: tag.name,
        Slug: tag.slug,
      })),
    };
  }  

  /**
   * Finds all items.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of items.
   * This is curently unused!
   */
  static async findAllItems(limit = 10, skip = 0) {
    const items = await ItemModel.find()
      .sort({ soldCount: -1, _id: 1  })
      .select(
        "title slug shortDescription price actionPrice categories tags featureImage status"
      )
      .populate('categories tags')
      .skip(skip)
      .limit(limit)
      .lean();

    if (!items) {
      ErrorHelper.throwNotFoundError("Artikli");
    }

    return ItemService.mapItemsForCard(items);
  }

  /**
   * Finds featured items.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of featured items.
   */
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

      const categoryDocs = await CategoryModel.find({
        slug: { $in: slugs }
      }).select("_id");

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

      const tagDocs = await TagModel.find({
        slug: { $in: slugs }
      }).select("_id");

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

  /**
   * Finds action items.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of action items.
   */
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

      const categoryDocs = await CategoryModel.find({
        slug: { $in: slugs }
      }).select("_id");

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

      const tagDocs = await TagModel.find({
        slug: { $in: slugs }
      }).select("_id");

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

  /**
   * Finds items by category.
   *
   * @param {string} category - The category to filter items by.
   * @returns {Promise<Array>} - A promise that resolves to an array of items.
   */
  static async findItemsByCategory(
  category,
  status = null,
  excludeStatus = null,
  limit = 10,
  skip = 0
) {
  const filter = {};

  // 1. Mapiraj slugove u ObjectId
  let slugs = [];

  try {
    slugs = Array.isArray(category)
      ? category
      : category.split(",").map((c) => c.trim());
  } catch (err) {
    slugs = [category];
  }

  // Sanitize ako stigne objekat
  slugs = slugs.map((c) => {
    if (typeof c === "string") return c;
    if (typeof c === "object" && c.Slug) return c.Slug;
    return "";
  }).filter(Boolean);

  const categoryDocs = await CategoryModel.find({
    slug: { $in: slugs }
  }).select("_id");

  const categoryIds = categoryDocs.map((cat) => cat._id);

  if (!categoryIds.length) {
    return {
      items: [],
      totalCount: 0
    };
  }

  filter.categories = { $in: categoryIds };

  // 2. Status filtering
  const excluded = new Set();
  if (excludeStatus) {
    const excl = Array.isArray(excludeStatus)
      ? excludeStatus
      : [excludeStatus];
    excl.forEach((e) => excluded.add(e));
  }
  excluded.add("not-published");

  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    filter.status = {
      $in: statuses,
      $nin: Array.from(excluded)
    };
  } else {
    filter.status = { $nin: Array.from(excluded) };
  }

  // 3. Dohvati artikle
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

  return {
    items: ItemService.mapItemsForShop(items),
    totalCount: itemCount,
    metadata: {
      metadata: {
        title: categoryDocs[0]?.name || "",
        description: categoryDocs[0]?.shortDescription || "",
        longDescription: categoryDocs[0]?.longDescription || ""
      }
    }
  };
}

  
  /**
   * Finds items by tag.
   *
   * @param {string} tag - The tag to filter items by.
   * @returns {Promise<Array>} - A promise that resolves to an array of items.
   */
  static async findItemsByTag(
    tag,
    status = null,
    excludeStatus = null,
    limit = 10,
    skip = 0
  ) {
    const filter = {};

    // 1. Mapiraj ulaz u niz slugova
    let slugs = [];

    try {
      slugs = Array.isArray(tag)
        ? tag
        : tag.split(",").map((t) => t.trim());
    } catch (err) {
      slugs = [tag];
    }

    slugs = slugs.map((t) => {
      if (typeof t === "string") return t.toLowerCase();
      if (typeof t === "object" && t.slug) return t.slug.toLowerCase();
      return "";
    }).filter(Boolean);

    // 2. Dohvati Tag dokumente
    const tagDocs = await TagModel.find({
      slug: { $in: slugs }
    }).select("_id");

    const tagIds = tagDocs.map((t) => t._id);

    if (!tagIds.length) {
      return {
        items: [],
        totalCount: 0
      };
    }

    filter.tags = { $in: tagIds };

    // 3. Status filtering
    const excluded = new Set();
    if (excludeStatus) {
      const excl = Array.isArray(excludeStatus) ? excludeStatus : [excludeStatus];
      excl.forEach(e => excluded.add(e));
    }
    excluded.add("not-published");

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filter.status = {
        $in: statuses,
        $nin: Array.from(excluded)
      };
    } else {
      filter.status = { $nin: Array.from(excluded) };
    }

    // 4. Dohvati artikle
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

    return {
      items: ItemService.mapItemsForShop(items),
      totalCount: itemCount,
      metadata: {
        title: tagDocs[0]?.name || "",
        description: tagDocs[0]?.shortDescription || "",
        longDescription: tagDocs[0]?.longDescription || ""
      }
    };
  }

  /**
   * Finds items by search query.
   *
   * @param {string} search - The search query to filter items by.
   * @returns {Promise<Array>} - A promise that resolves to an array of items.
   */
  static async findItemsBySearch(search, limit = 10, page = 1, cond = false) {
    const skip = (page - 1) * limit;
    const filter = { $and: [] };

    if (!cond) {
      filter.$and.push({ status: { $ne: "not-published" } });
    }

    if (search) {
      const searchNumber = parseFloat(search);
      const conditions = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { status: { $elemMatch: { $regex: search, $options: "i" } } },
        { keyWords: { $regex: search, $options: "i" } }
      ];

      if (!isNaN(searchNumber)) {
        conditions.push({ price: searchNumber });
        conditions.push({ actionPrice: searchNumber });
      }

      // Pretraga po kategorijama (slug ili title)
      const matchingCategories = await CategoryModel.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } }
        ]
      }).select("_id");

      if (matchingCategories.length > 0) {
        const categoryIds = matchingCategories.map((cat) => cat._id);
        conditions.push({ categories: { $in: categoryIds } });
      }

      // NOVO: Pretraga po tagovima (slug ili name)
      const matchingTags = await TagModel.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } }
        ]
      }).select("_id");

      if (matchingTags.length > 0) {
        const tagIds = matchingTags.map((tag) => tag._id);
        conditions.push({ tags: { $in: tagIds } });
      }

      filter.$and.push({ $or: conditions });
    }

    if (filter.$and.length === 0) {
      delete filter.$and;
    }

    const [items, itemCount] = await Promise.all([
      ItemModel.find(filter)
        .sort({ soldCount: -1, _id: 1 })
        .select("title slug shortDescription price actionPrice status categories tags keyWords featureImage")
        .populate("categories")
        .populate("tags") // NOVO: populacija tagova
        .skip(skip)
        .limit(limit)
        .lean(),
      ItemModel.countDocuments(filter)
    ]);

    if (!items || items.length === 0) {
      ErrorHelper.throwNotFoundError("Artikli");
    }

    let metadata = null;

    const foundCategory = await CategoryModel.findOne({ slug: search }).lean();
    if (foundCategory) {
      metadata = {
        title: foundCategory.name,
        description: foundCategory.shortDescription,
        longDescription: foundCategory.longDescription
      };
    }

    const foundTag = await TagModel.findOne({ slug: search }).lean();
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

  /**
   * Finds item details by ID or name.
   *
   * @param {string} idOrName - The ID or name of the item to find.
   * @returns {Promise<Object>} - A promise that resolves to the item details.
   */
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

  /**
   * Finds admin items.
   *
   * @param {string} [search] - The search query to filter items by.
   * @returns {Promise<Array>} - A promise that resolves to an array of admin items.
   */
  static async findAdminItems(limit = 10, page = 1) {
    const skip = (page - 1) * limit;
    const items = await ItemModel.find()
      .sort({ soldCount: -1, _id: 1 })
      .select(
        "title slug shortDescription price actionPrice categories tags status sku featureImage"
      )
      .populate("categories tags")
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

  /**
   * Finds item details by ID for admin.
   *
   * @param {string} itemId - The ID of the item to find.
   * @returns {Promise<Object>} - A promise that resolves to the item details.
   */
  static async findItemDetailsByIdForAdmin(id) {
    const item = await ItemModel.findById(id).populate("categories tags");

    if (!item) {
      ErrorHelper.throwNotFoundError("Artikal");
    }

    return ItemService.mapItemDetailsForAdmin(item);
  }

  /**
   * Finds an item for the cart by its ID.
   *
   * @param {string} itemId - The ID of the item to find.
   * @returns {Promise<Object>} - A promise that resolves to the item details.
   */
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

  /**
   * Finds up-sell and cross-sell items.
   *
   * @param {string} itemId - The ID of the item to find related items for.
   * @returns {Promise<Array>} - A promise that resolves to an array of related items.
   */
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
  
  /**
   * Creates a new item.
   *
   * @param {Object} itemData - The data of the item to create.
   * @param {string} itemData.title - The title of the item.
   * @param {string} itemData.sku - The SKU of the item.
   * @param {number} itemData.price - The price of the item.
   * @param {number} [itemData.actionPrice] - The action price of the item (optional).
   * @param {string} itemData.shortDescription - The short description of the item.
   * @param {string} itemData.description - The detailed description of the item.
   * @param {Array<string>} itemData.keyWords - The keywords associated with the item.
   * @param {Array<string>} itemData.categories - The categories the item belongs to.
   * @param {Array<string>} itemData.tags - The tags associated with the item.
   * @param {boolean} itemData.backorderAllowed - Whether backorders are allowed for the item.
   * @param {Array<Object>} [itemData.variations] - The variations of the item (optional).
   * @param {Array<string>} [itemData.upSellItems] - The IDs of up-sell items (optional).
   * @param {Array<string>} [itemData.crossSellItems] - The IDs of cross-sell items (optional).
   * @returns {Promise<Object>} - A promise that resolves to the created item.
   */
  static async createNewItem(body, files) {
    // --- [1] Feature image obrada ---
    const featureImageFile = files.find(file => file.fieldname === 'featureImage');
    const featureImage = {
      img: featureImageFile ? featureImageFile.originalname : null,
      imgDesc: sanitize(body.featureImageDesc || ""),
    };

    const slug = generateSlug(body.title);

    // --- [2] Variations obrada ---
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
          onAction: sanitize(variation.onAction) || false,
        });
      });
    }

    // --- [3] UpSell i CrossSell obrada ---
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

    // --- ✅ [4] Mapiranje kategorija preko slug-ova u ObjectId ---
    let categoryIds = [];
    if (body.categories && body.categories.length > 0) {
      const categorySlugs = Array.isArray(body.categories)
        ? body.categories.map(c => sanitize(c))
        : [sanitize(body.categories)];

      const categoryDocs = await CategoryModel.find({
        slug: { $in: categorySlugs },
      }).select("_id");

      categoryIds = categoryDocs.map(cat => cat._id);
    }

    // --- [5] Kreiranje objekta ---
    const newItemData = {
      title: sanitize(body.title),
      slug,
      sku: sanitize(body.sku),
      price: sanitize(body.price),
      actionPrice: sanitize(body.actionPrice),
      shortDescription: sanitize(body.shortDescription),
      description: sanitize(body.description),
      keyWords: sanitize(body.keyWords || []),
      categories: categoryIds, // ✅ lista ObjectId referenci
      tags: sanitize(body.tags || []),
      status: sanitize(body.status || "normal"),
      backorder: { isAllowed: sanitize(body.backorderAllowed === "on") },
      variations,
      featureImage,
      upSellItems: upSellDetails,
      crossSellItems: crossSellDetails,
    };

    // --- [6] Video ako postoji ---
    const videoFile = files.find(file => file.fieldname === 'video');
    if (videoFile) {
      newItemData.video = {
        vid: videoFile.originalname,
        vidDesc: sanitize(body.videoDesc || null),
      };
    }

    // --- [7] Sačuvaj u bazu ---
    const newItem = new ItemModel(newItemData);
    return await newItem.save();
  }

  /**
   * Updates an item.
   *
   * @param {string} itemId - The ID of the item to update.
   * @param {Object} itemData - The data of the item to update.
   * @returns {Promise<Object>} - A promise that resolves to the updated item.
   */
  static async updateItem(itemId, body, files) {
    try {
      const existingItem = await ItemModel.findById(itemId);
      if (!existingItem) {
        ErrorHelper.throwNotFoundError("Artikal");
      }

      const slug = generateSlug(body.title);

      // === FEATURE IMAGE ===
      const featureImageFile = files.find(file => file.fieldname === 'featureImage');
      if (files && featureImageFile) {
        existingItem.featureImage = {
          img: featureImageFile.originalname,
          imgDesc: sanitize(body.featureImageDesc || ""),
        };
      }

      // === VIDEO ===
      const videoFile = files.find(file => file.fieldname === 'video');
      if (videoFile) {
        existingItem.video = {
          vid: videoFile.originalname,
          vidDesc: sanitize(body.videoDesc || null),
        };
      }

      // === VARIACIJE ===
      if (body.variations) {
        body.variations = body.variations.map((variation) => {
          const isNew = variation._id?.startsWith("new-");
          const existingVar = !isNew
            ? existingItem.variations.find(v => v._id.toString() === variation._id)
            : null;

          const file = files ? files.find(f => f.fieldname === `variationImage_${variation._id}`) : null;

          const varObj = {
            size: variation.size,
            color: variation.color,
            amount: Number(variation.amount) || (existingVar?.amount || 0),
            image: {
              img: file ? file.originalname : existingVar?.image?.img || "",
              imgDesc: variation.imgDesc || existingVar?.image?.imgDesc || "",
            },
            onAction: variation.onAction ?? existingVar?.onAction ?? false,
          };

          if (!isNew) {
            varObj._id = variation._id;
          }

          return varObj;
        });
      } else {
        body.variations = existingItem.variations;
      }
      existingItem.variations = body.variations;

      // === OSNOVNA POLJA ===
      existingItem.title = body.title || existingItem.title;
      existingItem.slug = slug || existingItem.slug;
      existingItem.sku = body.sku || existingItem.sku;
      existingItem.shortDescription = body.shortDescription || existingItem.shortDescription;
      existingItem.description = body.description || existingItem.description;
      existingItem.keyWords = body.keyWords || existingItem.keyWords;

      // === KATEGORIJE ===
      if (body.categories && body.categories.length > 0) {
        const categorySlugs = Array.isArray(body.categories)
          ? body.categories.map(c => sanitize(c))
          : [sanitize(body.categories)];

        const categoryDocs = await CategoryModel.find({
          slug: { $in: categorySlugs },
        }).select("_id");

        const categoryIds = categoryDocs.map(cat => cat._id);
        existingItem.categories = categoryIds;
      } else {
        existingItem.categories = existingItem.categories;
      }

      // === TAGOVI ===
      existingItem.tags = body.tags || existingItem.tags;

      // === STATUS + NOTIFIKACIJA ===
      const newStatus = Array.isArray(body.status) ? body.status : [body.status];
      const existingStatus = Array.isArray(existingItem.status) ? existingItem.status : [existingItem.status];

      if (newStatus.includes("action") && !existingStatus.includes("action")) {
        await EmailService.notifyUsersFromItemWishlist(existingItem._id);
      }

      existingItem.status = body.status || existingItem.status;

      // === CENE, BACKORDER, UPSELL, CROSSSELL ===
      existingItem.price = body.price || existingItem.price;
      existingItem.actionPrice = body.actionPrice || [];

      existingItem.upSellItems = body.upSellItems || [];
      existingItem.crossSellItems = body.crossSellItems || existingItem.crossSellItems;

      existingItem.backorder.isAllowed =
        body.backorderAllowed === "on" || existingItem.backorder.isAllowed;

      const updatedItem = await existingItem.save();
      return updatedItem;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
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

  // Funkcija za dobijanje artikla na osnovu ID-ja
  static async findUpCrossSellItems(itemId) {
    const item = await ItemModel.findById(itemId).select(
      "_id title shortDescription featureImage"
    );
    return item;
  }

  /**
   * Adds a backorder to an item.
   *
   * @param {string} itemId - The ID of the item to add a backorder to.
   * @param {string} variationId - The ID of the variation to add a backorder to.
   * @param {number} amount - The amount of the backorder.
   * @param {string|null} userId - The ID of the user placing the backorder (optional).
   * @returns {Promise<Object>} - A promise that resolves to the updated item.
   */
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

  /**
   * Updates the amount of an item by its ID.
   *
   * @param {string} itemId - The ID of the item to update.
   * @param {number} amount - The new amount of the item.
   * @returns {Promise<Object>} - A promise that resolves to the updated item.
   */
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

      // Povećaj (ili smanji, ako je negativan) amount varijacije
      variation.amount = (variation.amount || 0) + Number(amount);

      // Sačuvaj artikal unutar sesije
      await item.save({ session });
      return item;
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }

  /**
   * Detaches item references from upSellItems and crossSellItems.
   *
   * @param {string} itemId - The ID of the item to detach references from.
   * @param {Object} session - The mongoose session object.
   * @returns {Promise<Object>} - A promise that resolves to the item object.
   */
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

  /**
   * Deletes an item by its ID.
   *
   * @param {string} itemId - The ID of the item to delete.
   * @returns {Promise<void>}
   */
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

  /**
   * Maps items for the shop.
   *
   * @param {Array} items - The array of items to map.
   * @returns {Array} - An array of mapped items.
   */
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
        value: item.categories.map(cat => ({
          Naziv: cat.name,
          Slug: cat.slug
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

  static mapItemDetails(item) {
    // Prvo izvuci unikatne slike iz variations
    const uniqueVariationImages = Array.from(
      new Map(
        item.variations
          .filter(v => v.image && v.image.img) // ignoriši ako nema slike
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
