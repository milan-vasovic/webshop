document.addEventListener('DOMContentLoaded', function() {
  // Preuzimamo podatke iz data atributa (npr. postavljenih u skrivenom elementu #item-data)
  const itemDataEl = document.getElementById('item-data');
  const variations = JSON.parse(itemDataEl.getAttribute('data-variations'));
  const backorderAllowed = itemDataEl.getAttribute('data-backorder') === 'true';
  const defaultImage = itemDataEl.getAttribute('data-default-image'); // naziv fajla bez putanje (npr. "default.jpg")

  // Ostali DOM selektori (forma, input polja, itd.)
  const variationsSelect = document.getElementById('variationsSelect');
  const amountInput = document.getElementById('amountInput');
  const stockMessage = document.getElementById('stockMessage');
  const productForm = document.getElementById('productForm');
  const formSubmitContainer = document.getElementById('formSubmitContainer');

  // Funkcija koja ažurira prikaz na osnovu izabrane varijacije
  function updateVariation(index) {
    const variation = variations[index];

    // Ažuriranje glavnog medija – ovde, čak i ako je prethodno bio video, želimo prikazati sliku
    if (variation.Slika && variation.Slika.URL) {
      // Koristimo selectMedia da uvek prikažemo sliku
      selectMedia("image", variation.Slika.URL, variation.Slika.Opis || '');
    } else {
      // Ako nema specifične slike, koristimo podrazumevanu sliku
      selectMedia("image", defaultImage, "Default slika");
    }

    // Ažuriranje input polja i forme (prema dostupnoj količini)
    const availableQuantity = variation.Količina;
    formSubmitContainer.innerHTML = ''; // reset dugmeta

    if (availableQuantity < 1) {
      if (backorderAllowed) {
        productForm.action = '/prodavnica/backorder-dodavanje';
        stockMessage.textContent = "Nema na stanju, ali poručivanje (backorder) je dozvoljeno.";
        amountInput.removeAttribute('max');

        const backorderBtn = document.createElement('button');
        backorderBtn.type = 'submit';
        backorderBtn.id = 'submitBtn';
        backorderBtn.textContent = 'Poruči (backorder)';
        formSubmitContainer.appendChild(backorderBtn);
      } else {
        stockMessage.textContent = "Nema na stanju.";
        productForm.action = ''; // poništavamo akciju forme
      }
    } else {
      productForm.action = '/prodavnica/korpa-dodavanje';
      stockMessage.textContent = "";
      amountInput.max = availableQuantity;

      const addToCartBtn = document.createElement('button');
      addToCartBtn.type = 'submit';
      addToCartBtn.id = 'submitBtn';
      addToCartBtn.textContent = 'Dodaj u korpu';
      formSubmitContainer.appendChild(addToCartBtn);
    }

    // Ažuriramo skriveno polje sa ID-em izabrane varijacije
    document.getElementById('variationId').value = variation.ID;
  }

  // Inicijalno postavljanje – prikaz prve varijacije
  updateVariation(0);

  // Event listener za promenu varijacije
  variationsSelect.addEventListener('change', function(e) {
    const selectedIndex = parseInt(e.target.value, 10);
    updateVariation(selectedIndex);
  });
});
