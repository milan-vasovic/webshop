import { ObjectId } from "mongodb";
import sanitize from "mongo-sanitize";
import { generateSlug } from "../helper/slugHelper.js";

import ItemModel from "../model/item.js";

import ErrorHelper from "../helper/errorHelper.js";
import EmailService from "./emailService.js";

class ItemService {
  /**
   * Finds all admin add items based on category and itemId.
   *
   * @param {string|null} category - The category or categories to filter items by.
   * @param {string|null} itemId - The ID of the item to exclude from the results.
   * @returns {Promise<Array>} - A promise that resolves to an array of items.
   */
  static async findAllAdminAddItems(category = null, itemId = null) {
    let categories;
    try {
      categories = category.split(",").map((category) => category.trim());
    } catch (err) {
      categories = category;
    }

    // If itemId is passed it means that we are looking for all other items with at least one same category, except the current one with itemId
    if (itemId) {
      const items = await ItemModel.find({
        categories: { $in: categories },
        _id: { $ne: itemId },
      })
        .select("id title")
        .exec();

      if (!items) {
        return ErrorHelper.throwNotFoundError("Artikli");
      }

      return items.map((item) => ({
        ID: { value: item._id },
        Naziv: { value: item.title },
      }));
    }

    if (category) {
      const items = await ItemModel.find({ categories: { $in: categories } })
        .select("id title")
        .exec();

      if (!items) {
        return ErrorHelper.throwNotFoundError("Artikli");
      }

      return items.map((item) => ({
        ID: { value: item._id },
        Naziv: { value: item.title },
      }));
    }

    const items = await ItemModel.find().select("id title").exec();

    if (!items) {
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
    let categories;
    try {
      categories = category.split(",").map((category) => category.trim());
    } catch (err) {
      categories = category;
    }

    const items = await ItemModel.find({
      categories: { $ne: categories },
      _id: { $ne: itemId },
    })
      .select("id title")
      .exec();

    if (!items) {
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
  static async findAllCategories(tag = null) {
    let filter = { status: { $ne: "not-published" } };
  
    if (tag) {
      let tags;
      try {
        tags = tag.split(",").map((tag) => tag.trim());
      } catch (err) {
        tags = tag;
      }
  
      filter.tags = { $in: tags };
    }
  
    const categories = await ItemModel.distinct("categories", filter);
  
    return {
      Kategorije: categories,
    };
  }  

  /**
   * Finds all tags.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of tags.
   */
  static async findAllTags(category = null) {
    const filter = { status: { $ne: "not-published" } };
  
    if (category) {
      let categories;
      try {
        categories = category.split(",").map((category) => category.trim());
      } catch (err) {
        categories = category;
      }
  
      filter.categories = { $in: categories };
    }
  
    const tags = await ItemModel.distinct("tags", filter);
  
    const sortedTags = tags.sort((a, b) => a.localeCompare(b, "sr", { sensitivity: 'base' }));

    return {
      Tagovi: sortedTags,
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
      filter.categories = { $regex: category, $options: "i" };
    }

    if (tag) {
      filter.tags = { $regex: tag, $options: "i" };
    }

    const items = await ItemModel.find(filter)
      .sort({ soldCount: -1, _id: 1  })
      .select(
        "title slug shortDescription price actionPrice featureImage status"
      )
      .skip(skip)
      .limit(limit)
      .lean();

    if (!items) {
      ErrorHelper.throwNotFoundError("Istaknuti Artikli");
    }

    return ItemService.mapItemsForShop(items);
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
      filter.categories = { $regex: category, $options: "i" };
    }

    if (tag) {
      filter.tags = { $regex: tag, $options: "i" };
    }

    const items = await ItemModel.find(filter)
      .sort({ soldCount: -1, _id: 1  })
      .select(
        "title slug shortDescription price actionPrice featureImage status"
      )
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
    const filter = {
      categories: category
    };
  
    // Uvek isključi not-published
    const excluded = new Set();
    if (excludeStatus) {
      const excl = Array.isArray(excludeStatus) ? excludeStatus : [excludeStatus];
      excl.forEach(e => excluded.add(e));
    }
    excluded.add("not-published");
  
    // Ako postoji status, koristi $in i $nin zajedno
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filter.status = {
        $in: statuses,
        $nin: Array.from(excluded)
      };
    } else {
      filter.status = { $nin: Array.from(excluded) };
    }
  
    const [items, itemCount] = await Promise.all([
      ItemModel.find(filter)
        .sort({ soldCount: -1, _id: 1 })
        .select("title slug shortDescription price actionPrice featureImage status")
        .skip(skip)
        .limit(limit)
        .lean(),
      ItemModel.countDocuments(filter)
    ]);
  
    return {
      items: ItemService.mapItemsForShop(items),
      totalCount: itemCount
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
    const filter = {
      tags: tag
    };
  
    // Uvek isključi not-published
    const excluded = new Set();
    if (excludeStatus) {
      const excl = Array.isArray(excludeStatus) ? excludeStatus : [excludeStatus];
      excl.forEach(e => excluded.add(e));
    }
    excluded.add("not-published");
  
    // Ako postoji status, koristi $in i $nin zajedno
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filter.status = {
        $in: statuses,
        $nin: Array.from(excluded)
      };
    } else {
      filter.status = { $nin: Array.from(excluded) };
    }
    
    const [items, itemCount] = await Promise.all([
      ItemModel.find(filter)
        .sort({ soldCount: -1, _id: 1 })
        .select("title slug shortDescription price actionPrice featureImage status")
        .skip(skip)
        .limit(limit)
        .lean(),
      ItemModel.countDocuments(filter)
    ]);
  
    return {
      items: ItemService.mapItemsForShop(items),
      totalCount: itemCount
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
  
    const filter = {
      $and: []
    };
  
    if (!cond) {
      filter.$and.push({ status: { $ne: "not-published" } });
    }
  
    if (search) {
      const searchNumber = parseFloat(search);
      const conditions = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { categories: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { keyWords: { $regex: search, $options: "i" } }
      ];
  
      if (!isNaN(searchNumber)) {
        conditions.push({ price: searchNumber });
        conditions.push({ actionPrice: searchNumber });
      }
  
      filter.$and.push({ $or: conditions });
    }
  
    // Ako je $and prazan, brišemo ga da ne bi pravio problem
    if (filter.$and.length === 0) {
      delete filter.$and;
    }
  
    const [items, itemCount] = await Promise.all([
      ItemModel.find(filter)
        .sort({ soldCount: -1, _id: 1 })
        .select("title slug shortDescription price actionPrice status categories tags keyWords featureImage")
        .skip(skip)
        .limit(limit)
        .lean(),
      ItemModel.countDocuments(filter)
    ]);
  
    if (!items || items.length === 0) {
      ErrorHelper.throwNotFoundError("Artikli");
    }
  
    return {
      items: ItemService.mapItemsForCard(items),
      totalCount: itemCount
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
      );

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }

      return ItemService.mapItemDetails(item);
    }

    const item = await ItemModel.findById(id).select(
      "title slug keyWords shortDescription price actionPrice description categories tags featureImage video status backorder variations upSellItems crossSellItems"
    );

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
    const item = await ItemModel.findById(id);

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
    const featureImageFile = files.find(file => file.fieldname === 'featureImage');
    const featureImage = {
        img: featureImageFile ? featureImageFile.originalname : null,
        imgDesc: sanitize(body.featureImageDesc || ""),
    };
    console.log("featureImage", featureImage);
    const slug = generateSlug(body.title);
    // Variations
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

    let upSellItems = body.upSellItems ? sanitize(body.upSellItems) : [];
    let upSellDetails = [];

    if (upSellItems.length > 0) {
      upSellDetails = await Promise.all(
        upSellItems.map(async (id) => {
          const item = await this.findItemDetailsForUpCrossSell(id);
          return {
            itemId: item._id,
            title: item.title,
            shortDescription: item.shortDescription,
            featureImage: {
              img: item.featureImage.img,
              imgDesc: item.featureImage.imgDesc,
            },
          };
        })
      );
    }

    let crossSellItems = body.crossSellItems
      ? sanitize(body.crossSellItems)
      : [];
    let crossSellDetails = [];

    if (crossSellItems.length > 0) {
      crossSellDetails = await Promise.all(
        crossSellItems.map(async (id) => {
          const item = await this.findItemDetailsForUpCrossSell(id);
          return {
            itemId: item._id,
            title: item.title,
            shortDescription: item.shortDescription,
            featureImage: {
              img: item.featureImage.img,
              imgDesc: item.featureImage.imgDesc,
            },
          };
        })
      );
    }

    const newItemData = {
      title: sanitize(body.title),
      slug: slug,
      sku: sanitize(body.sku),
      price: sanitize(body.price),
      actionPrice: sanitize(body.actionPrice),
      shortDescription: sanitize(body.shortDescription),
      description: sanitize(body.description),
      keyWords: sanitize(body.keyWords || []),
      categories: sanitize(body.categories || []),
      tags: sanitize(body.tags || []),
      status: sanitize(body.status || "normal"),
      backorder: { isAllowed: sanitize(body.backorderAllowed === "on") },
      variations,
      featureImage: {
        img: featureImage.img,
        imgDesc: featureImage.imgDesc,
      },
      upSellItems: upSellDetails || [],
      crossSellItems: crossSellDetails || [],
    };

    // Video
    const videoFile = files.find(file => file.fieldname === 'video');
    let video;
    if (videoFile) {
      video = {
          vid: videoFile.originalname,
          vidDesc: sanitize(body.videoDesc || null),
      };

      newItemData.video = video;
    }

    // Sačuvaj u bazu
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
      // Pronađi postojeći artikal
      const existingItem = await ItemModel.findById(itemId);
      if (!existingItem) {
        ErrorHelper.throwNotFoundError("Artikal");
      }
      const slug = generateSlug(body.title);

      // Obrada featureImage – ako je upload-ovana nova slika, ažuriraj, inače zadrži staru
      const featureImageFile = files.find(file => file.fieldname === 'featureImage');
      if (files && featureImageFile) {
        existingItem.featureImage = {
          img: featureImageFile ? featureImageFile.originalname : null,
          imgDesc: sanitize(body.featureImageDesc || ""),
        };
      }

      const videoFile = files.find(file => file.fieldname === 'video');
      let video;
      if (videoFile) {
        video = {
            vid: videoFile.originalname,
            vidDesc: sanitize(body.videoDesc || null),
        };

        existingItem.video = video;
      }

      // Obrada varijacija
      if (body.variations) {
        body.variations = body.variations.map((variation) => {
          // Proveri da li je varijacija nova (privremeni ID)
          const isNew = variation._id.startsWith("new-");
      
          // Pronađi postojeću varijaciju, ako postoji, koristeći _id (ako nije nova)
          const existingVar = !isNew 
            ? existingItem.variations.find(v => v._id.toString() === variation._id) 
            : null;
      
          // Pokušaj da pronađeš fajl koji odgovara ovoj varijaciji
          // Očekujemo da je file input ime formirano kao "variationImage_<variation._id>"
          const file = files ? files.find(f => f.fieldname === `variationImage_${variation._id}`) : null;
      
          // Kreiraj objekt varijacije; ako varijacija nije nova, zadrži _id, a ako jeste, ne postavljaj _id
          const varObj = {
            size: variation.size,
            color: variation.color,
            amount: Number(variation.amount) || (existingVar ? existingVar.amount : 0),
            image: {
              img: file ? file.originalname : (existingVar && existingVar.image && existingVar.image.img) || "",
              imgDesc: variation.imgDesc || (existingVar && existingVar.image && existingVar.image.imgDesc) || ""
            },
            onAction: variation.onAction || (existingVar ? existingVar.onAction : false),
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

      // Ažuriraj ostale podatke
      existingItem.title = body.title || existingItem.title;
      existingItem.slug = slug || existingItem.slug;
      existingItem.sku = body.sku || existingItem.sku;
      existingItem.shortDescription =
        body.shortDescription || existingItem.shortDescription;
      existingItem.description = body.description || existingItem.description;
      existingItem.keyWords = body.keyWords || existingItem.keyWords;
      existingItem.categories = body.categories || existingItem.categories;
      existingItem.tags = body.tags || existingItem.tags;

      // Pretvaranje statusa u niz (ako već nije niz)
      const newStatus = Array.isArray(body.status) ? body.status : [body.status];
      const existingStatus = Array.isArray(existingItem.status) ? existingItem.status : [existingItem.status];

      // Provera da li je "action" dodat u novim statusima, a prethodno nije bio prisutan
      if (newStatus.includes("action") && !existingStatus.includes("action")) {
        await EmailService.notifyUsersFromItemWishlist(existingItem._id);
      }

      existingItem.status = body.status || existingItem.status;

      existingItem.price = body.price || existingItem.price;
      existingItem.actionPrice = body.actionPrice || [];
      existingItem.upSellItems = body.upSellItems || [];
      existingItem.crossSellItems =
        body.crossSellItems || existingItem.crossSellItems;
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
      Kategorije: { value: item.categories },
      Tagovi: { value: item.tags },
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
      Opis: { value: item.shortDescription },
      Status: { value: item.status.join(", ") },
      Kategorije: { value: item.categories.join(", ") },
      Tagovi: { value: item.tags.join(", ") },
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
      Kategorije: { value: item.categories },
      Tagovi: { value: item.tags },
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
      Kategorije: { value: item.categories.join(", ") },
      Tagovi: { value: item.tags.join(", ") },
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
