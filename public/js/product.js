function selectMedia(type, url, description = "") {
  const mainMediaContainer = document.querySelector(".gallery__main-media");
  const existing = document.getElementById("main-media");

  if (type === "image") {
    const newImageHTML = `<img id="main-media" src="/images/${url}" alt="${description}" class="gallery__main-image">`;
    mainMediaContainer.innerHTML = newImageHTML;
  } else if (type === "video") {
    const newVideoHTML = `
      <video id="main-media" controls class="gallery__main-video">
        <source src="/videos/${url}" type="video/mp4">
        ${description}
      </video>`;
    mainMediaContainer.innerHTML = newVideoHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const itemDataEl = document.getElementById('item-data');
  const variations = JSON.parse(itemDataEl.getAttribute('data-variations'));
  const backorderAllowed = itemDataEl.getAttribute('data-backorder') === 'true';
  const defaultImage = itemDataEl.getAttribute('data-default-image');
  const itemStatus = (itemDataEl.getAttribute('data-status') || "")
    .split(',').map(s => s.trim());
  const basePrice = parseFloat(itemDataEl.getAttribute('data-price'));
  const actionPrice = parseFloat(itemDataEl.getAttribute('data-action-price'));

  const priceDisplay = document.getElementById('productPriceDisplay');
  const variationsSelect = document.getElementById('variationsSelect');
  const amountInput = document.getElementById('amountInput');
  const stockMessage = document.getElementById('stockMessage');
  const productForm = document.getElementById('productForm');
  const formSubmitContainer = document.getElementById('formSubmitContainer');
  const variationIdInput = document.getElementById('variationId');

  function updatePriceDisplay(isAction) {
    if (!priceDisplay) return;
    if (isAction && !isNaN(actionPrice)) {
      priceDisplay.innerHTML = `<s>${basePrice} RSD</s> <span class="highlight">${actionPrice} RSD</span>`;
    } else {
      priceDisplay.innerHTML = `${basePrice} RSD`;
    }
  }

  function updateVariation(index) {
    const variation = variations[index];
    const isOnAction = variation.Akcija && itemStatus.includes("action");
    updatePriceDisplay(isOnAction);

    if (variation.Slika?.URL) {
      selectMedia("image", variation.Slika.URL, variation.Slika.Opis || '');
    } else {
      selectMedia("image", defaultImage, "Default slika");
    }

    const availableQuantity = variation.Količina;
    formSubmitContainer.innerHTML = '';

    if (availableQuantity < 1) {
      if (backorderAllowed) {
        productForm.action = '/prodavnica/backorder-dodavanje';
        stockMessage.textContent = "Nema na stanju, ali poručivanje (backorder) je dozvoljeno.";
        amountInput.removeAttribute('max');
        amountInput.disabled = false;
        amountInput.value = 1;

        const backorderBtn = document.createElement('button');
        backorderBtn.type = 'submit';
        backorderBtn.id = 'submitBtn';
        backorderBtn.className = 'button button--primary mt-3';
        backorderBtn.textContent = 'Poruči (backorder)';
        formSubmitContainer.appendChild(backorderBtn);
      } else {
        productForm.action = '';
        stockMessage.textContent = "Nema na stanju.";
        amountInput.disabled = true;

        const disabledBtn = document.createElement('button');
        disabledBtn.type = 'button';
        disabledBtn.id = 'submitBtn';
        disabledBtn.className = 'button button--primary mt-3';
        disabledBtn.disabled = true;
        disabledBtn.textContent = 'Nedostupno';
        formSubmitContainer.appendChild(disabledBtn);
      }
    } else {
      productForm.action = '/prodavnica/korpa-dodavanje';
      stockMessage.textContent = "";
      amountInput.max = availableQuantity;
      amountInput.disabled = false;

      const addToCartBtn = document.createElement('button');
      addToCartBtn.type = 'submit';
      addToCartBtn.id = 'submitBtn';
      addToCartBtn.className = 'button button--primary mt-3';
      addToCartBtn.textContent = 'Dodaj u korpu';
      formSubmitContainer.appendChild(addToCartBtn);
    }

    variationIdInput.value = variation.ID;
  }

  updateVariation(0);

  variationsSelect.addEventListener('change', (e) => {
    const selectedIndex = parseInt(e.target.value, 10);
    updateVariation(selectedIndex);
  });

  // Overlay logika (samo slike)
  const overlay = document.getElementById('overlay');
  const overlayImg = document.getElementById('overlay-img');
  const closeBtn = overlay.querySelector('.close-btn');

  document.addEventListener('click', (e) => {
    const mainMedia = document.getElementById('main-media');

    if (e.target === mainMedia && mainMedia.tagName.toLowerCase() === 'img') {
      overlayImg.src = mainMedia.src;
      overlay.style.display = 'flex';
      document.body.classList.add('no-scroll');
    }

    if (e.target === closeBtn || e.target === overlay) {
      overlay.style.display = 'none';
      overlayImg.src = "";
      document.body.classList.remove('no-scroll');
    }
  });
});
