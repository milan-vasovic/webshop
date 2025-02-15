document.addEventListener("DOMContentLoaded", () => {
    // Toggle za unos novog broja telefona
    const addNewTelephoneBtn = document.getElementById("addNewTelephoneBtn");
    if (addNewTelephoneBtn) {
      addNewTelephoneBtn.addEventListener("click", () => {
        const newNumberContainer = document.getElementById("newNumber");
        // Ako kontejner već ima sadržaj, ukloni ga, inače ga dodaj
        if (newNumberContainer.innerHTML.trim() !== "") {
          newNumberContainer.innerHTML = "";
        } else {
          newNumberContainer.innerHTML = `
            <label class="main-form__label" for="newTelephone">Broj:</label>
            <input id="newTelephone" type="text" name="newTelephone" placeholder="Unesite novi broj telefona" class="main-form__input">
            <input type="hidden" name="isNewTelephone" value="true">
          `;
        }
      });
    }
  
    // Toggle za unos nove adrese
    const addNewAddressBtn = document.getElementById("addNewAddressBtn");
    if (addNewAddressBtn) {
      addNewAddressBtn.addEventListener("click", () => {
        const newAddressContainer = document.getElementById("newAddress");
        if (newAddressContainer.innerHTML.trim() !== "") {
          newAddressContainer.innerHTML = "";
        } else {
            newAddressContainer.innerHTML = `
            <div class="grid grid-2 width-100">
              <div class="main-form__group">
                <label class="main-form__label" for="newCityInput">Grad:</label>
                <input id="newCityInput" name="newCity" class="main-form__input" type="text" required>
              </div>
              <div class="main-form__group">
                <label class="main-form__label" for="newStreetInput">Ulica:</label>
                <input id="newStreetInput" name="newStreet" class="main-form__input" type="text" required>
              </div>
              <div class="main-form__group">
                <label class="main-form__label" for="newNumberInput">Broj Ulice:</label>
                <input id="newNumberInput" name="newAddressNumber" class="main-form__input" type="text" required>
              </div>
              <div class="main-form__group">
                <label class="main-form__label" for="newPostalCodeInput">Poštanski Broj:</label>
                <input id="newPostalCodeInput" name="newPostalCode" class="main-form__input" type="text">
              </div>
            </div>
            <input type="hidden" name="isNewAddress" value="true">
          `;
        }
      });
    }
  });
  