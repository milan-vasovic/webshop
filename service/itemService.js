import ItemModel from "../model/item.js";
import ErrorHelper from "../helper/errorHelper.js";
import sanitizeHtml from 'sanitize-html';
import sanitize from 'mongo-sanitize';
import { ObjectId } from 'mongodb';

class ItemService {
    static async findAllAdminAddItems (category=null, itemId=null) {
        let categories;
        try {
            categories = category.split(',').map(category => category.trim());
        } catch (err) {
            categories = category
        }

        
        // IF itemId is passed it means that we are looking for all other items with at least one same category, except the current one with itemId
        if (itemId) {
            const items = await ItemModel.find({ categories: { $in: categories }, _id: { $ne: itemId }}).select("id title").exec();

            if (!items) {
                return ErrorHelper.throwNotFoundError("Artikli")
            }

            return items.map(item => ({
                ID: { value: item._id },
                Naziv: { value: item.title }
            }));
        }

        if(category) {
            const items = await ItemModel.find({ categories: { $in: categories }}).select("id title").exec();

            if (!items) {
                return ErrorHelper.throwNotFoundError("Artikli")
            }
    
            return items.map(item => ({
                ID: { value: item._id },
                Naziv: { value: item.title }
            }));
        }

        const items = await ItemModel.find().select("id title").exec();

        if (!items) {
            return ErrorHelper.throwNotFoundError("Artikli")
        }

        return items.map(item => ({
            ID: { value: item._id },
            Naziv: { value: item.title }
        }));
    }

    static async findAllAdminAddItemsByCategory(category, itemId) {
        let categories;
        try {
            categories = category.split(',').map(category => category.trim());
        } catch (err) {
            categories = category;
        }

        const items = await ItemModel.find({ categories: { $ne: categories}, _id: { $ne: itemId } }).select("id title").exec();

        if (!items) {
            return ErrorHelper.throwNotFoundError("Artikli")
        }
        
        return items.map(item => ({
            ID: { value: item._id },
            Naziv: { value: item.title }
        }));
    }

    static async findAllCategories(tag=null) {
        if (tag) {
            let tags;
            try {
                tags = tag.split(',').map(tag => tag.trim());
            } catch (err) {
                tags = tag;
            }

            const categories = await ItemModel.distinct('categories', { tags: { $in: tags } });

            if (!categories) {
                ErrorHelper.throwNotFoundError("Kategorije");
            }

            return {
                Kategorije: categories
            };
        }

        const categories = await ItemModel.distinct('categories');

        if (!categories) {
            ErrorHelper.throwNotFoundError("Kategorije");
        }

        return {
            Kategorije: categories
        };
    }

    static async findAllTags(category=null) {
        if (category) {
            let categories;
            try {
                categories = category.split(',').map(category => category.trim());
            } catch (err) {
                categories = category;
            }
            const tags = await ItemModel.distinct('tags', { categories: { $in: categories} });

            if (!tags) {
                ErrorHelper.throwNotFoundError("Tagovi");
            }
    
            return {
                Tagovi: tags
            };
        }
        const tags = await ItemModel.distinct('tags');

        if (!tags) {
            ErrorHelper.throwNotFoundError("Tagovi");
        }

        return {
            Tagovi: tags
        };
    }

    static async findAllItems(limit = 10, skip = null) {
        const items = await ItemModel.find()
            .sort({ soldCount: -1 })
            .select("title shortDescription price actionPrice categories tags featureImage status")
            .limit(limit)
            .lean();

        if (!items) {
            ErrorHelper.throwNotFoundError("Artikli");
        }

        return ItemService.mapItemsForCard(items);
    }

    static async findFeaturedItems(category = null, tag = null, limit = 10 ) {
        const filter = { status: { $in: ["featured"] } };
    
        if (category) {
            filter.categories = { $regex: category, $options: "i" };
        }
    
        if (tag) {
            filter.tags = { $regex: tag, $options: "i" };
        }
    
        const items = await ItemModel.find(filter)
            .sort({ soldCount: -1 })
            .select("title shortDescription price actionPrice categories tags featureImage status")
            .limit(limit)
            .lean();

        if (!items) {
            ErrorHelper.throwNotFoundError("Istaknuti Artikli");
        }

        return ItemService.mapItemsForCard(items);
    }
    
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
            .select("title shortDescription price actionPrice categories tags featureImage status")
            .limit(limit)
            .lean();

        if (!items) {
            ErrorHelper.throwNotFoundError("Akcijski Artikli");
        }

        return ItemService.mapItemsForCard(items);
    }

    static async findItemsByCategory(category, status = null, excludeStatus = null, limit = 10) {
        const filter = { categories: category };
    
        if (status) {
            filter.status = { $in: Array.isArray(status) ? status : [status] };
        }
    
        if (excludeStatus) {
            filter.status = { $nin: Array.isArray(excludeStatus) ? excludeStatus : [excludeStatus] };
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
    

    static async findItemsByTag(tag, status = null, excludeStatus = null, limit = 10) {
        const filter = { tags: tag };
    
        if (status) {
            filter.status = { $in: Array.isArray(status) ? status : [status] };
        }
    
        if (excludeStatus) {
            filter.status = { $nin: Array.isArray(excludeStatus) ? excludeStatus : [excludeStatus] };
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

    static async findItemsBySearch(filter, skip, limit) {
        const items = await ItemModel.find(filter)
            .select("title shortDescription price actionPrice status categories tags keyWords featureImage")
            .skip(skip)
            .limit(limit)
            .lean();
        
        if (!items) {
            ErrorHelper.throwNotFoundError("Artikli");
        }
     
        return ItemService.mapItemsForCard(items);
    }

    static async findItemDetailsByIdOrName(id, itemName=null) {
        if (itemName) {
            const item = await ItemModel.findOne({title: itemName})
            .select("title keyWords shortDescription price actionPrice description categories tags featureImage video status backorder variations upSellItems crossSellItems")
        
            if (!item) {
                ErrorHelper.throwNotFoundError("Artikal");
            }
        
            return ItemService.mapItemDetails(item);
        }

        const item = await ItemModel.findById(id)
            .select("title keyWords shortDescription price actionPrice description categories tags featureImage video status backorder variations upSellItems crossSellItems")
        
        if (!item) {
            ErrorHelper.throwNotFoundError("Artikal");
        }
    
        return ItemService.mapItemDetails(item);
    }

    static async findAdminItems(limit = 10, skip = null) {
        const items = await ItemModel.find()
            .select("title shortDescription price actionPrice categories tags status sku featureImage")
            .sort({ soldCount: -1 })
            .limit(limit)
            .skip(skip)
            .lean();
        
        if (!items) {
            ErrorHelper.throwNotFoundError("Artikli");
        }

        return ItemService.mapItemsForCardForAdmin(items);
    }

    static async findItemDetailsByIdForAdmin(id) {
        const item = await ItemModel.findById(id)
        
        if (!item) {
            ErrorHelper.throwNotFoundError("Artikal");
        }

        return ItemService.mapItemDetailsForAdmin(item);
    }

    static async findItemForCart(itemId, variationId, amount, code=null) {
        try {
            const item = await ItemModel.findById(itemId);

            if (!item) {
                ErrorHelper.throwNotFoundError("Artikal")
            }

            let itemPrice;

            if (item.status && item.status.includes("action")) {
                itemPrice = item.actionPrice;
            } else {
                itemPrice = item.price;
            }

            const variation = item.variations.find(v => 
                v._id.toString() === variationId.toString()
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
                price: Number(itemPrice*amount),
                code: code
            }

            return result;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async createNewItem(body, files) {
        const featureImage = {
            img: files.featureImage[0].originalname,
            imgDesc: body.featureImageDesc || "",
        };
    
        // Video
        const video = {
            vid: files.video ? files.video[0].path : "images/",
            vidDesc: body.videoDesc || "opis",
        };
    
        // Variacije
        const variations = [];
    
        if (body.variations && files.variationImages) {
            body.variations.forEach((variation, index) => {
                variations.push({
                    size: variation.size,
                    color: variation.color,
                    amount: Number(variation.amount),
                    image: {
                        img: files.variationImages[index] ? files.variationImages[index].originalname : null,
                        imgDesc: variation.imageDesc || null,
                    },
                });
            });
        }
    
        const newItemData = {
            title: body.title,
            sku: body.sku,
            price: body.price,
            actionPrice: body.actionPrice,
            shortDescription: body.shortDescription,
            description: body.description,
            keyWords: body.keyWords || [],
            categories: body.categories || [],
            tags: body.tags || [],
            status: body.status || "normal",
            backorder: { isAllowed: body.backorderAllowed === "on" },
            variations,
            featureImage: {
                img: featureImage.img,
                imgDesc: featureImage.imgDesc
            },
            video,
            upSellItems: body.upSellItems || [],
            crossSellItems: body.crossSellItems || [],
        };
    
        // Sačuvaj u bazu
        const newItem = new ItemModel(newItemData);
        return await newItem.save();
    }
    
    static async updateItem(itemId, body, files) {
        try {
            // Pronađi postojeći artikal
            const existingItem = await ItemModel.findById(itemId);
            if (!existingItem) {
                ErrorHelper.throwNotFoundError("Artikal");
            }
    
            // Ažuriraj featureImage samo ako je nova slika dostavljena
            if (files && files.featureImage) {
                existingItem.featureImage = {
                    img: files.featureImage[0].originalname,
                    imgDesc: body.featureImageDesc || existingItem.featureImage.imgDesc,
                };
            }
    
            // Ažuriraj video samo ako je novi video dostavljen
            if (files && files.video) {
                existingItem.video = {
                    vid: files.video[0].path,
                    vidDesc: body.videoDesc || existingItem.video.vidDesc,
                };
            }
    
            // Ažuriraj varijacije
            if (body.variations) {
                existingItem.variations = body.variations.map((variation, index) => {
                    const existingVariation = existingItem.variations[index] || {};
    
                    return {
                        size: variation.size || existingVariation.size,
                        color: variation.color || existingVariation.color,
                        amount: Number(variation.amount) || existingVariation.amount,
                        image: {
                            img: files.variationImages && files.variationImages[index]
                                ? files.variationImages[index].originalname
                                : existingVariation.image?.img,
                            imgDesc: variation.imgDesc || existingVariation.image?.imgDesc,
                        },
                    };
                });
            }
    
            // Ažuriraj ostale podatke
            existingItem.title = body.title || existingItem.title;
            existingItem.sku = body.sku || existingItem.sku;
            existingItem.price = body.price || existingItem.price;
            existingItem.actionPrice = body.actionPrice || existingItem.actionPrice;
            existingItem.shortDescription = body.shortDescription || existingItem.shortDescription;
            existingItem.description = body.description || existingItem.description;
            existingItem.keyWords = body.keyWords || existingItem.keyWords;
            existingItem.categories = body.categories || existingItem.categories;
            existingItem.tags = body.tags || existingItem.tags;
            existingItem.status = body.status || existingItem.status;
            existingItem.backorder.isAllowed = body.backorderAllowed === "on" || existingItem.backorder.isAllowed;
    
            // Postavi upSellItems i crossSellItems
            existingItem.upSellItems = body.upSellItems || existingItem.upSellItems;
            existingItem.crossSellItems = body.crossSellItems || existingItem.crossSellItems;
    
            // Sačuvaj ažurirani artikal
            const updatedItem = await existingItem.save();
            return updatedItem;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }
    
    // Funkcija za dobijanje artikla na osnovu ID-ja
    static async findUpCrossSellItems(itemId) {
        const item = await ItemModel.findById(itemId).select('_id title shortDescription featureImage');
        return item;
    }

    static async addBackorderToItem(itemId, variationId, amount, userId=null) {
        try {
            const item = await ItemModel.findById(itemId).select('variations backorder');

            if (!item) {
                ErrorHelper.throwNotFoundError("Artikal");
            }

            const variation = item.variations.find(v => 
                v._id.toString() === variationId.toString()
            );

            if (userId) {
                item.backorder.orders.push({
                    userId: userId,
                    size: variation.size,
                    color: variation.color,
                    amount: amount
                })
            } else {
                item.backorder.orders.push({
                    size: variation.size,
                    color: variation.color,
                    amount: amount
                })
            }


            return item.save();

        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async updateItemAmountById(itemId, amount, variationId, session) {
        try {
          const item = await ItemModel.findById(itemId).select("soldCount variations");
      
          if (!item) {
            ErrorHelper.throwNotFoundError("Artikal");
          }
          const variationIndex = item.variations.findIndex(
            variation => variation._id.toString() === variationId.toString()
          );
      
          if (variationIndex > -1) {
            item.variations[variationIndex].amount -= amount;
          } else {

            ErrorHelper.throwNotFoundError("Varijacija nije pronađena");
          }
      
          return await item.save({ session });
        } catch (error) {
          ErrorHelper.throwServerError(error);
        }
    }
    
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
            "Akcijska Cena": { value: item.actionPrice }
        }));
    }

    static mapItemsForCard(items) {
        return items.map((item) => ({
            ID: { value: item._id },
            Naziv: { value: item.title },
            Opis: { value: item.shortDescription },
            Status: { value: item.status.join(", ") },
            Kategorije: { value: item.categories.join(", ")},
            Tagovi: { value: item.tags.join(", ")},
            Slika: {
                value: item.featureImage.img,
                Opis: item.featureImage.imgDesc,
            },
            Cena: { value: item.price },
            "Akcijska Cena": { value: item.actionPrice }
        }));
    }

    static mapItemsForCardForAdmin(items) {
        return items.map((item) => ({
            ID: { value: item._id },
            SKU: {value: item.sku },
            Naziv: { value: item.title },
            Opis: { value: item.shortDescription },
            Status: { value: item.status.join(", ") },
            Kategorije: { value: item.categories.join(", ")},
            Tagovi: { value: item.tags.join(", ")},
            Slika: {
                value: item.featureImage.img,
                Opis: item.featureImage.imgDesc,
            },
            Cena: { value: item.price },
            "Akcijska Cena": { value: item.actionPrice }
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
            "Backorder": {
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
            "Backorder": {
                Dozvoljeno: item.backorder.isAllowed,
                Naručeno: item.backorder.orders.map((order) => ({
                    Korisnik: order.userId,
                    Veličina: order.size,
                    Boja: order.color,
                    Količina: order.amount,
                })),
            },
            Varijacije: item.variations.map((variation) => ({
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
