import ErrorHelper from "../helper/errorHelper.js";
import NewsletterModel from "../model/newsletter.js";

class NewsletterService {
  static async createNewsletter(name, email) {
    try {
      const existingNewsletter = await NewsletterModel.findOne({ email });

      if (existingNewsletter) {
        return {
          success: false,
          message: "Već ste se prijavili na našu listu.",
        };
      }

      const newsletter = new NewsletterModel({
        name,
        email,
        acceptance: true,
      });

      await newsletter.save();

      return {
        success: true,
        message: "Uspešno ste se prijavili na našu listu.",
      };
    } catch (error) {
      ErrorHelper.throwServerError(error);
    }
  }
}

export default NewsletterService;
