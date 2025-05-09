document.addEventListener('DOMContentLoaded', function() {
  // Preuzimamo podatke iz data atributa (npr. postavljenih u skrivenom elementu #item-data)
  const itemDataEl = document.getElementById('item-data');
  const variations = JSON.parse(itemDataEl.getAttribute('data-variations'));
  const backorderAllowed = itemDataEl.getAttribute('data-backorder') === 'true';
  const defaultImage = itemDataEl.getAttribute('data-default-image'); // naziv fajla bez putanje (npr. "default.jpg")
  const itemStatusAttr = itemDataEl.getAttribute('data-status');
  const itemStatus = itemStatusAttr ? itemStatusAttr.split(',').map(s => s.trim()) : [];
  const basePrice = parseFloat(itemDataEl.getAttribute('data-price'));
  const actionPrice = parseFloat(itemDataEl.getAttribute('data-action-price'));
  const priceDisplay = document.getElementById('productPriceDisplay');

  // Ostali DOM selektori (forma, input polja, itd.)
  const variationsSelect = document.getElementById('variationsSelect');
  const amountInput = document.getElementById('amountInput');
  const stockMessage = document.getElementById('stockMessage');
  const productForm = document.getElementById('productForm');
  const formSubmitContainer = document.getElementById('formSubmitContainer');
  const quantityContainer = document.getElementById('amountInput'); // novi kontejner

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
    // Ažuriranje glavnog medija
    if (variation.Slika && variation.Slika.URL) {
      selectMedia("image", variation.Slika.URL, variation.Slika.Opis || '');
    } else {
      selectMedia("image", defaultImage, "Default slika");
    }

    const availableQuantity = variation.Količina;
    formSubmitContainer.innerHTML = ''; // reset dugmeta

    if (availableQuantity < 1) {
      if (backorderAllowed) {
        productForm.action = '/prodavnica/backorder-dodavanje';
        stockMessage.textContent = "Nema na stanju, ali poručivanje (backorder) je dozvoljeno.";
        amountInput.removeAttribute('max');

        // Prikazujemo količinu (možda kao 1) – ili ostavite vidljivo
        if (quantityContainer) {
          quantityContainer.style.display = ''; // ostaje vidljivo
        }

        const backorderBtn = document.createElement('button');
        backorderBtn.type = 'submit';
        backorderBtn.id = 'submitBtn';
        backorderBtn.classList.add('btn-primary');
        backorderBtn.textContent = 'Poruči (backorder)';
        formSubmitContainer.appendChild(backorderBtn);
      } else {
        stockMessage.textContent = "Nema na stanju.";
        productForm.action = '';
        // Sakrij polje za količinu
        if (quantityContainer) {
          quantityContainer.style.display = 'none';
        }
        formSubmitContainer.innerHTML = '';
      }
    } else {
      // Ako ima zaliha, obezbediti da je polje za količinu vidljivo
      if (quantityContainer) {
        quantityContainer.style.display = '';
      }
      productForm.action = '/prodavnica/korpa-dodavanje';
      stockMessage.textContent = "";
      amountInput.max = availableQuantity;

      const addToCartBtn = document.createElement('button');
      addToCartBtn.type = 'submit';
      addToCartBtn.id = 'submitBtn';
      addToCartBtn.classList.add('btn-primary');
      addToCartBtn.textContent = 'Dodaj u korpu';
      formSubmitContainer.appendChild(addToCartBtn);
    }

    // Ažuriramo skriveno polje sa ID-em izabrane varijacije
    document.getElementById('variationId').value = variation.ID;
  }

  // Inicijalno postavljanje – prikaz prve varijacije
  updateVariation(0);

  variationsSelect.addEventListener('change', function(e) {
    const selectedIndex = parseInt(e.target.value, 10);
    updateVariation(selectedIndex);
  });

   // Pronađi sve slike koje se mogu kliknuti (sličice)
   const thumbnail = document.getElementById('main-media');

   // Pronađi overlay element i sliku unutar overlay-a
   const overlay = document.getElementById('overlay');
   const overlayImg = document.getElementById('overlay-img');
   const closeBtn = document.querySelector('.close-btn');

   // Kada se klikne na sličicu, prikaži je u overlay-u
    thumbnail.addEventListener('click', function() {
      overlay.style.display = 'flex';
      overlayImg.src = this.src;
    });

   // Kada se klikne na dugme za zatvaranje, sakrij overlay
   closeBtn.addEventListener('click', function() {
   overlay.style.display = 'none';
   });

   // Opcionalno: Zatvori overlay klikom na pozadinu
   overlay.addEventListener('click', function(event) {
   if (event.target === overlay) {
       overlay.style.display = 'none';
   }
   });
});
