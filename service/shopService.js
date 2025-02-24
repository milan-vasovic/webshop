import ItemService from "../service/itemService.js";

import ErrorHelper from "../helper/errorHelper.js";

class ShopService {
    /**
    * Finds items for the shop, including categories, tags, featured items, action items, and items by category.
    * 
    * @returns {Promise<Object>} - A promise that resolves to an object containing all the shop items and metadata.
    */
    static async findItemsForShop() {
        try {
            const categories = await ItemService.findAllCategories();

            const tags = await ItemService.findAllTags();

            const featuredItems = await ItemService.findFeaturedItems();

            const actionItems = await ItemService.findActionItems();

            const itemsByCategory = await Promise.all(
                categories.Kategorije.map(async (category) => {
                    const items = await ItemService.findItemsByCategory(category);

                    return {
                        Kategorija: { value: category },
                        Artikli: items,
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
            ErrorHelper.throwValidationError(error);
        }
    }

    /**
    * Finds items by category, including featured items, action items, and other items within the category.
    * 
    * @param {string} category - The category to filter items by.
    * @returns {Promise<Object>} - A promise that resolves to an object containing items by category and their tags.
    */
    static async findItemsByCategory(category) {
        try {
            const featuredCategoryItems = await ItemService.findFeaturedItems(category)

            const actionedCategoryItems = await ItemService.findActionItems(category);
                
            const otherCategoryItems = await ItemService.findItemsByCategory(category, null, ['featured', 'action'])

            const tags = await ItemService.findAllTags(category);
            
            const result = {
                Tagovi: { value: tags.Tagovi },
                "Istaknuti Artikli": featuredCategoryItems,
                "Artikli Na Akciji": actionedCategoryItems,
                Artikli: otherCategoryItems,
            };
    
            return result;

        } catch (error) {
            ErrorHelper.throwValidationError(error);
        }
    }

    /**
    * Finds items by tags.
    * 
    * @param {Array<string>} tags - The tags to filter items by.
    * @returns {Promise<Array>} - A promise that resolves to an array of items.
    */
    static async findItemsByTags(tag) {
        try {
            const featuredTagItems = await ItemService.findFeaturedItems(null, tag);

            const actionedTagItems = await ItemService.findActionItems(null, tag);
                
            const otherTagItems = await ItemService.findItemsByTag(tag, null, ['featured', 'action']);

            const categories = await ItemService.findAllCategories(tag);

            const result = {
                Kategorije: { value: categories.Kategorije },
                "Istaknuti Artikli": featuredTagItems,
                "Artikli Na Akciji": actionedTagItems,
                Artikli: otherTagItems,
            };
    
            return result;

        } catch (error) {
            ErrorHelper.throwValidationError(error);
        }
    }

    /**
    * Finds items by search query.
    * 
    * @param {string} search - The search query to filter items by.
    * @returns {Promise<Array>} - A promise that resolves to an array of items.
    */
    static async findItemsBySearch(search, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const filter = {
                $or: [
                    { title: { $regex: search, $options: "i" } },
                    { categories: { $regex: search, $options: "i" } },
                    { tags: { $regex: search, $options: "i" } },
                    { keyWords: { $regex: search, $options: "i" } },
                ],
            };
        
            const items = await ItemService.findItemsBySearch(filter);
        
            const result = {
                Artikli: items
            };

            return result
        } catch (error) {
            ErrorHelper.throwValidationError(error);
        }  
    }

    /**
    * Finds an item by its name.
    * 
    * @param {string} name - The name of the item to find.
    * @returns {Promise<Object>} - A promise that resolves to the item details.
    */
    static async findItemByName(itemName) {
        try {
            const item = await ItemService.findItemDetailsByIdOrName(null,itemName);

            return item;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }

    static async findFeaturedItems() {
        try {
            const items = await ItemService.findFeaturedItems();

            if (!items) {
                ErrorHelper.throwNotFoundError("Artikli");
            }

            const uniqueCategories = new Set();
            const uniqueTags = new Set();

            items.forEach(item => {
                if (item.Kategorije && Array.isArray(item.Kategorije.value)) {
                    item.Kategorije.value.forEach(cat => {
                    if (cat) uniqueCategories.add(cat);
                    });
                }
                
                if (item.Tagovi && Array.isArray(item.Tagovi.value)) {
                    item.Tagovi.value.forEach(tag => {
                    if (tag) uniqueTags.add(tag);
                    });
                }
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

    static async findActionedItems() {
        try {
            const items = await ItemService.findActionItems();

            if (!items) {
                ErrorHelper.throwNotFoundError("Artikli");
            }

            const uniqueCategories = new Set();
            const uniqueTags = new Set();

            items.forEach(item => {
                if (item.Kategorije && Array.isArray(item.Kategorije.value)) {
                    item.Kategorije.value.forEach(cat => {
                    if (cat) uniqueCategories.add(cat);
                    });
                }
                
                if (item.Tagovi && Array.isArray(item.Tagovi.value)) {
                    item.Tagovi.value.forEach(tag => {
                    if (tag) uniqueTags.add(tag);
                    });
                }
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
