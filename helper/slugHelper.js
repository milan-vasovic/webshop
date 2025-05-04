import slugify from "slugify";

/**
 * Generates a URL-friendly slug from a given string.
 * @param {string} title - The title or text to convert into a slug.
 * @returns {string} The generated slug.
 */
export function generateSlug(title) {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true
  });
}
