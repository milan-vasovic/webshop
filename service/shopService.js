import ItemService from "../service/itemService.js";
import ErrorHelper from "../helper/errorHelper.js";

class ShopService {
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

    static async findItemByName(itemName) {
        try {
            const item = await ItemService.findItemDetailsByIdOrName(null,itemName);

            return item;
        } catch (error) {
            ErrorHelper.throwServerError(error);
        }
    }
}

export default ShopService;
