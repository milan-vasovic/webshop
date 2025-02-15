function selectMedia(type, url, description = "") {
  const mainMediaContainer = document.querySelector(".gallery__main-media");
  let mainMediaElement = document.getElementById('main-media');

  if (type === "image") {
    // Ako je već prikazan element slika, ažuriramo atribute
    if (mainMediaElement && mainMediaElement.tagName.toLowerCase() === "img") {
      mainMediaElement.src = `/images/${url}`;
      mainMediaElement.alt = description;
    } else {
      // Ako element ne postoji ili nije <img> (npr. prethodno video), kreiramo novi <img>
      mainMediaContainer.innerHTML = `<img id="main-media" src="/images/${url}" alt="${description}">`;
    }
  } else if (type === "video") {
    if (mainMediaElement && mainMediaElement.tagName.toLowerCase() === "video") {
      let sourceElement = mainMediaElement.querySelector("source");
      if (sourceElement) {
        sourceElement.src = `/videos/${url}`;
      } else {
        mainMediaContainer.innerHTML = `
          <video id="main-media" controls>
            <source src="/videos/${url}" type="video/mp4">
            ${description}
          </video>
        `;
        return;
      }
      mainMediaElement.innerHTML = `<source src="/videos/${url}" type="video/mp4"> ${description}`;
      mainMediaElement.load();
    } else {
      mainMediaContainer.innerHTML = `
        <video id="main-media" controls>
          <source src="/videos/${url}" type="video/mp4">
          ${description}
        </video>
      `;
    }
  }
}

// Postojeći event listener za thumbnail-e
document.addEventListener("DOMContentLoaded", () => {
  const thumbnailsContainer = document.querySelector(".gallery__thumbnails");

  thumbnailsContainer.addEventListener("click", (event) => {
    // Proveravamo da li je kliknuti element thumbnail
    const thumbnail = event.target.closest(".gallery__thumbnail");
    if (!thumbnail) return;

    // Preuzimamo podatke iz data atributa
    const type = thumbnail.dataset.type;
    const url = thumbnail.dataset.url;
    const description = thumbnail.dataset.description;

    // Pozivamo funkciju selectMedia sa odgovarajućim parametrima
    selectMedia(type, url, description);
  });
});
