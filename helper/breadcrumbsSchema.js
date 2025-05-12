export function generateBreadcrumbJsonLd(breadcrumbs = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: process.env.BASE_URL +  crumb.href
    }))
  };
}
