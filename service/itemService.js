import { ObjectId } from "mongodb";
import sanitize from "mongo-sanitize";

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
    if (tag) {
      let tags;
      try {
        tags = tag.split(",").map((tag) => tag.trim());
      } catch (err) {
        tags = tag;
      }

      const categories = await ItemModel.distinct("categories", {
        tags: { $in: tags },
      });

      if (!categories) {
        ErrorHelper.throwNotFoundError("Kategorije");
      }

      return {
        Kategorije: categories,
      };
    }

    const categories = await ItemModel.distinct("categories");

    if (!categories) {
      ErrorHelper.throwNotFoundError("Kategorije");
    }

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
    if (category) {
      let categories;
      try {
        categories = category.split(",").map((category) => category.trim());
      } catch (err) {
        categories = category;
      }
      const tags = await ItemModel.distinct("tags", {
        categories: { $in: categories },
      });

      if (!tags) {
        ErrorHelper.throwNotFoundError("Tagovi");
      }

      return {
        Tagovi: tags,
      };
    }
    const tags = await ItemModel.distinct("tags");

    if (!tags) {
      ErrorHelper.throwNotFoundError("Tagovi");
    }

    return {
      Tagovi: tags,
    };
  }

  /**
   * Finds all items.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of items.
   */
  static async findAllItems(limit = 10, skip = null) {
    const items = await ItemModel.find()
      .sort({ soldCount: -1 })
      .select(
        "title shortDescription price actionPrice categories tags featureImage status"
      )
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
  static async findFeaturedItems(category = null, tag = null, limit = 10) {
    const filter = { status: { $in: ["featured"] } };

    if (category) {
      filter.categories = { $regex: category, $options: "i" };
    }

    if (tag) {
      filter.tags = { $regex: tag, $options: "i" };
    }

    const items = await ItemModel.find(filter)
      .sort({ soldCount: -1 })
      .select(
        "title shortDescription price actionPrice categories tags featureImage status"
      )
      .limit(limit)
      .lean();

    if (!items) {
      ErrorHelper.throwNotFoundError("Istaknuti Artikli");
    }

    return ItemService.mapItemsForCard(items);
  }

  /**
   * Finds action items.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of action items.
   */
  static async findActionItems(category = null, tag = null, limit = 10) {
    const filter = { status: { $in: ["action"] } };

    if (category) {
      filter.categories = { $regex: category, $options: "i" };
    }

    if (tag) {
      filter.tags = { $regex: tag, $options: "i" };
    }

    const items = await ItemModel.find(filter)
      .sort({ soldCount: -1 })
      .select(
        "title shortDescription price actionPrice categories tags featureImage status"
      )
      .limit(limit)
      .lean();

    if (!items) {
      ErrorHelper.throwNotFoundError("Akcijski Artikli");
    }

    return ItemService.mapItemsForCard(items);
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
    limit = 10
  ) {
    const filter = { categories: category };

    if (status) {
      filter.status = { $in: Array.isArray(status) ? status : [status] };
    }

    if (excludeStatus) {
      filter.status = {
        $nin: Array.isArray(excludeStatus) ? excludeStatus : [excludeStatus],
      };
    }

    const items = await ItemModel.find(filter)
      .sort({ soldCount: -1 })
      .select("title shortDescription price actionPrice featureImage status")
      .limit(limit)
      .lean();

    if (!items) {
      ErrorHelper.throwNotFoundError("Kategorije");
    }

    return ItemService.mapItemsForShop(items);
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
    limit = 10
  ) {
    const filter = { tags: tag };

    if (status) {
      filter.status = { $in: Array.isArray(status) ? status : [status] };
    }

    if (excludeStatus) {
      filter.status = {
        $nin: Array.isArray(excludeStatus) ? excludeStatus : [excludeStatus],
      };
    }

    const items = await ItemModel.find(filter)
      .sort({ soldCount: -1 })
      .select("title shortDescription price actionPrice featureImage status")
      .limit(limit)
      .lean();

    if (!items) {
      ErrorHelper.throwNotFoundError("Tagovi");
    }

    return ItemService.mapItemsForShop(items);
  }

  /**
   * Finds items by search query.
   *
   * @param {string} search - The search query to filter items by.
   * @returns {Promise<Array>} - A promise that resolves to an array of items.
   */
  static async findItemsBySearch(filter, skip, limit) {
    const items = await ItemModel.find(filter)
      .select(
        "title shortDescription price actionPrice status categories tags keyWords featureImage"
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
   * Finds item details by ID or name.
   *
   * @param {string} idOrName - The ID or name of the item to find.
   * @returns {Promise<Object>} - A promise that resolves to the item details.
   */
  static async findItemDetailsByIdOrName(id, itemName = null) {
    if (itemName) {
      const item = await ItemModel.findOne({ title: itemName }).select(
        "title keyWords shortDescription price actionPrice description categories tags featureImage video status backorder variations upSellItems crossSellItems wishlist"
      );

      if (!item) {
        ErrorHelper.throwNotFoundError("Artikal");
      }

      return ItemService.mapItemDetails(item);
    }

    const item = await ItemModel.findById(id).select(
      "title keyWords shortDescription price actionPrice description categories tags featureImage video status backorder variations upSellItems crossSellItems"
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
  static async findAdminItems(search, limit = 10, skip = null) {
    let filter = {};

    if (search) {
      const searchNumber = parseFloat(search);
      let conditions = [
        { title: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { categories: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];

      if (!isNaN(searchNumber)) {
        conditions.push({ price: searchNumber });
        conditions.push({ actionPrice: searchNumber });
      }

      filter = { $or: conditions };
    }

    const items = await ItemModel.find(filter)
      .select(
        "title shortDescription price actionPrice categories tags status sku featureImage"
      )
      .sort({ soldCount: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    if (!items) {
      ErrorHelper.throwNotFoundError("Artikli");
    }

    return ItemService.mapItemsForCardForAdmin(items);
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

      let itemPrice;

      if (item.status && item.status.includes("action")) {
        itemPrice = item.actionPrice;
      } else {
        itemPrice = item.price;
      }

      const variation = item.variations.find(
        (v) => v._id.toString() === variationId.toString()
      );

      if (!variation) {
        ErrorHelper.throwNotFoundError("Varijacija");
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
        "title shortDescription featureImage"
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
    const featureImage = {
      img: files.featureImage ? files.featureImage[0].originalname : null,
      imgDesc: sanitize(body.featureImageDesc || ""),
    };

    // Variacije
    const variations = [];

    if (body.variations && files.variationImages) {
      body.variations.forEach((variation, index) => {
        variations.push({
          size: sanitize(variation.size),
          color: sanitize(variation.color),
          amount: Number(sanitize(variation.amount)),
          image: {
            img: files.variationImages[index]
              ? files.variationImages[index].originalname
              : null,
            imgDesc: sanitize(variation.imageDesc || null),
          },
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
    let video;
    if (files.video) {
      video = {
        vid: files.video ? files.video[0].originalname : null,
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

      // Obrada featureImage – ako je upload-ovana nova slika, ažuriraj, inače zadrži staru
      if (files && files.featureImage) {
        existingItem.featureImage = {
          img: files.featureImage[0].path,
          imgDesc: body.featureImageDesc || existingItem.featureImage.imgDesc,
        };
      }

      // Obrada videa – slično
      if (files && files.video) {
        existingItem.video = {
          vid: files.video[0].path,
          vidDesc: body.videoDesc || existingItem.video.vidDesc,
        };
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
            }
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
      existingItem.actionPrice = body.actionPrice || existingItem.actionPrice;
      existingItem.upSellItems = body.upSellItems || existingItem.upSellItems;
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
    return {
      ID: { value: item._id },
      Naziv: { value: item.title },
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
        Slike: item.variations.map((variation) => ({
          URL: variation.image.img,
          Opis: variation.image.imgDesc,
        })),
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
      Varijacije: item.variations.map((variation) => ({
        ID: variation._id,
        Veličina: variation.size,
        Boja: variation.color,
        Količina: variation.amount,
        Slika: {
          URL: variation.image.img,
          Opis: variation.image.imgDesc,
        },
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
