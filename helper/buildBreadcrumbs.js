// helpers/buildBreadcrumbs.js
export function buildBreadcrumbs({
    mode = null,      //"category", "tag", "search"
    item = null,      // item object with .title and .slug
    post = null,      // post object with .title and .slug
    category = null,  // category string
    tag = null,       // tag string
    search = null,    // search string  
    type = "item"     // "item" | "post"
  }) {
    const breadcrumbs = [
      { label: "Početna", href: "/" }
    ];

    if (type === "item") {
      breadcrumbs.push({ label: "Prodavnica", href: "/prodavnica" });
  
      if (mode === "action") {
        breadcrumbs.push({
          label: 'Artikli Na Akciji',
          href: `/prodavnica/akcija}`
        });
      }
  
      if (mode === "featured") {
        breadcrumbs.push({
          label: 'Istaknuti Artikli',
          href: `/prodavnica/istaknuto}`
        });
      }
      
      if (mode === "category" && category) {
        breadcrumbs.push({
          label: category,
          href: `/prodavnica/kategorija/${encodeURIComponent(category)}`
        });
      }
  
      if (mode === "tag" && tag) {
        breadcrumbs.push({
          label: tag,
          href: `/prodavnica/oznaka/${encodeURIComponent(tag)}`
        });
      }
  
      if (mode === "search" && search) {
        breadcrumbs.push({
          label: search,
          href: `/prodavnica/pretraga/${encodeURIComponent(search)}`
        });
      }

      if (item) {
        breadcrumbs.push({
          label: item.Naziv.value,
          href: `/prodavnica/artikal/${item.Link.value}`
        });
      }
    } else if (type === "post") {
      breadcrumbs.push({ label: "Forum", href: "/forum" });
  
      if (mode === "category" && category) {
        breadcrumbs.push({
          label: category,
          href: `/forum/kategorija/${encodeURIComponent(category)}`
        });
      }
  
      if (mode === "tag" && tag) {
        breadcrumbs.push({
          label: tag,
          href: `/forum/oznaka/${encodeURIComponent(tag)}`
        });
      }

      if (mode === "search" && search) {
        breadcrumbs.push({
          label: search,
          href: `/forum/pretraga/${encodeURIComponent(search)}`
        });
      }
  
      if (post) {
        breadcrumbs.push({
          label: post.Naziv.value,
          href: `/objava/${post.Link.value}`
        });
      }
    }
  
    return breadcrumbs;
  }
  