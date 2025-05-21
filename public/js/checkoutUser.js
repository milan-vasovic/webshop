document.addEventListener("DOMContentLoaded", () => {
  // Toggle za unos novog broja telefona
  const addNewTelephoneBtn = document.getElementById("addNewTelephoneBtn");
  if (addNewTelephoneBtn) {
    addNewTelephoneBtn.addEventListener("click", () => {
      const newNumberContainer = document.getElementById("newNumber");
      if (newNumberContainer.innerHTML.trim() !== "") {
        newNumberContainer.innerHTML = "";
      } else {
        newNumberContainer.innerHTML = `
          <div class="form__group">
            <label class="form__label" for="newTelephone">Novi Broj Telefona:</label>
            <input id="newTelephone" name="newTelephone" type="text" class="form__input" placeholder="Unesite novi broj" required>
          </div>
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
          <div class="form__grid-2">
            <div class="form__group">
              <label class="form__label" for="newCityInput">Grad:</label>
              <input id="newCityInput" name="newCity" type="text" class="form__input" required>
            </div>
            <div class="form__group">
              <label class="form__label" for="newStreetInput">Ulica:</label>
              <input id="newStreetInput" name="newStreet" type="text" class="form__input" required>
            </div>
            <div class="form__group">
              <label class="form__label" for="newNumberInput">Broj Ulice:</label>
              <input id="newNumberInput" name="newAddressNumber" type="text" class="form__input" required>
            </div>
            <div class="form__group">
              <label class="form__label" for="newPostalCodeInput">Poštanski Broj:</label>
              <input id="newPostalCodeInput" name="newPostalCode" type="text" class="form__input">
            </div>
          </div>
          <input type="hidden" name="isNewAddress" value="true">
        `;
      }
    });
  }
});
