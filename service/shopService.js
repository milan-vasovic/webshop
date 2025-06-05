import ItemService from "../service/itemService.js";

import ErrorHelper from "../helper/errorHelper.js";

class ShopService {
    /**
    * Finds items for the shop, including categories, tags, featured items, action items, and items by category.
    */
    static async findItemsForShop() {
        try {
            const categories = await ItemService.findAllCategories();

            const tags = await ItemService.findAllTags();

            const featuredItems = await ItemService.findFeaturedItems(null, null, 6);

            const actionItems = await ItemService.findActionItems(null, null, 6);

            const itemsByCategory = await Promise.all(
                categories.Kategorije.map(async (category) => {
                    const items = await ItemService.findItemsByCategory(category.Slug, null, ['action','featured'], 6);

                    return {
                        Kategorija: { value: category },
                        Artikli: items.items,
                        Ukupno: items.totalCount,
                    };
                })
            );

            // Organizacija svih podataka u rezultat
            const result = {
                Kategorije: { value: categories.Kategorije },
                Tagovi: { value: tags.Tagovi },
                "Istaknuti Artikli": featuredItems,
                "Artikli Na Akciji":actionItems,
                "Artikli Po Kategorijama": itemsByCategory,
            };

            return result;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    /**
    * Finds items by category, including featured items, action items, and other items within the category.
    */
    static async findItemsByCategory(category, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const featuredCategoryItems = await ItemService.findFeaturedItems(category, null, limit, skip);

            const actionedCategoryItems = await ItemService.findActionItems(category, null, limit, skip);
                
            const otherCategoryItems = await ItemService.findItemsByCategory(category, null, ['featured', 'action'], limit, skip);

            const tags = await ItemService.findAllTags();
            
            const result = {
                Tagovi: { value: tags.Tagovi },
                "Istaknuti Artikli": featuredCategoryItems,
                "Artikli Na Akciji": actionedCategoryItems,
                Artikli: otherCategoryItems.items,
                Ukupno: otherCategoryItems.totalCount,
            };
    
            return result;

        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    /**
    * Finds items by tags.
    */
    static async findItemsByTags(tag, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const featuredTagItems = await ItemService.findFeaturedItems(null, tag, limit, skip);

            const actionedTagItems = await ItemService.findActionItems(null, tag, limit, skip);
            
            const otherTagItems = await ItemService.findItemsByTag(tag, null, ['featured', 'action'], limit, skip);

            const categories = await ItemService.findAllCategories();

            const result = {
                Kategorije: { value: categories.Kategorije },
                "Istaknuti Artikli": featuredTagItems,
                "Artikli Na Akciji": actionedTagItems,
                Artikli: otherTagItems.items,
                Ukupno: otherTagItems.totalCount,
            };
    
            return result;

        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    /**
    * Finds items by search query.
    */
    static async findItemsBySearch(search, page = 1, limit = 10) {
        try {
            const items = await ItemService.findItemsBySearch(search, limit, page);
        
            const result = {
                Artikli: items.items,
                Ukupno: items.totalCount,
            };

            return result
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }  
    }

    /**
    * Finds an item by its name.
    */
    static async findItemBySlug(itemSlug) {
        try {
            const item = await ItemService.findItemDetailsByIdOrSlug(null,itemSlug);

            return item;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findFeaturedItems(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const items = await ItemService.findFeaturedItems(null, null, limit, skip);

            if (!items) {
                ErrorHelper.throwNotFoundError("Artikli");
            }

            const uniqueCategories = [];
            const uniqueTags = [];

            items.forEach(item => {
                item.Kategorije.value.forEach(cat => {
                    if (cat && !uniqueCategories.includes(cat)) {
                      uniqueCategories.push(cat);
                    }
                  });
                  
                  item.Tagovi.value.forEach(tag => {
                    if (tag && !uniqueTags.includes(tag)) {
                      uniqueTags.push(tag);
                    }
                  });
            });

            return {
                Kategorije: { value: uniqueCategories },
                Tagovi: { value: uniqueTags },
                "Istaknuti Artikli": items,
                "Artikli Na Akciji": [],
                "Artikli Po Kategorijama": [],
            };

        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findActionedItems(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const items = await ItemService.findActionItems(null, null, limit, skip);

            if (!items) {
                ErrorHelper.throwNotFoundError("Artikli");
            }

            const uniqueCategories = [];
            const uniqueTags = [];

            items.forEach(item => {
                item.Kategorije.value.forEach(cat => {
                    if (cat && !uniqueCategories.includes(cat)) {
                      uniqueCategories.push(cat);
                    }
                  });
                  
                  item.Tagovi.value.forEach(tag => {
                    if (tag && !uniqueTags.includes(tag)) {
                      uniqueTags.push(tag);
                    }
                  });
            });

            return {
                Kategorije: { value: uniqueCategories },
                Tagovi: { value: uniqueTags },
                "Istaknuti Artikli": [],
                "Artikli Na Akciji": items,
                "Artikli Po Kategorijama": [],
            };

        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }
}

export default ShopService;
