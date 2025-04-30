function selectMedia(type, url, description = "") {
  const mainMediaContainer = document.querySelector(".gallery__main-media");
  let mainMediaElement = document.getElementById('main-media');

  if (type === "image") {
    if (mainMediaElement && mainMediaElement.tagName.toLowerCase() === "img") {
      mainMediaElement.src = `/images/${url}`;
      mainMediaElement.alt = description;
    } else {
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

document.addEventListener("DOMContentLoaded", () => {
  const thumbnailsContainer = document.querySelector(".gallery__thumbnails");
  const overlay = document.getElementById("overlay");
  const overlayImg = document.getElementById("overlay-img");
  const closeBtn = overlay.querySelector(".close-btn");

  // Klik na thumbnail
  thumbnailsContainer.addEventListener("click", (event) => {
    const thumbnail = event.target.closest(".gallery__thumbnail");
    if (!thumbnail) return;

    const type = thumbnail.dataset.type;
    const url = thumbnail.dataset.url;
    const description = thumbnail.dataset.description;

    selectMedia(type, url, description);
  });

  // Klik na glavnu sliku otvara overlay
  const mainMediaContainer = document.querySelector(".gallery__main-media");
  mainMediaContainer.addEventListener("click", () => {
    const mainMedia = document.getElementById("main-media");
    if (mainMedia && mainMedia.tagName.toLowerCase() === "img") {
      overlayImg.src = mainMedia.src;
      overlay.style.display = "flex";
      document.body.classList.add("no-scroll");
    }
  });

  // Zatvori overlay klikom na X
  closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    overlayImg.src = "";
    document.body.classList.remove("no-scroll");
  });

  // Klik van slike zatvara overlay
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.style.display = "none";
      overlayImg.src = "";
      document.body.classList.remove("no-scroll");
    }
  });
});
