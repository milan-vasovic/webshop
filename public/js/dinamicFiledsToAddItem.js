document.addEventListener("DOMContentLoaded", () => {
  const availableCategories = [
  "Odeća", "Helanke", "Trenerke", "Fitness", "Kompleti",
  "Majice", "Farmerice", "Pantalone", "Šorc", "Haljine",
  "Suknje", "Kardigani", "Jakne", "Muško", "Žensko",
  "Kupaći Kostimi Jednodelni", "Kupaći Kostimi Dvodelni",
  "Zimsko", "Letnje", "Prolećno", "Jesenje", "Veš"
];

  const selectedCategories = [];
  const categoriesContainer = document.getElementById("categoriesContainer");
  const addCategoryButton = document.getElementById("addCategory");

  const updateSelectedCategories = () => {
    selectedCategories.length = 0;
    categoriesContainer.querySelectorAll("select").forEach(select => {
      if (select.value) selectedCategories.push(select.value);
    });
  };

  const updateCategoryOptions = () => {
    categoriesContainer.querySelectorAll("select").forEach(select => {
      const currentValue = select.value;
      select.innerHTML = "";
      availableCategories.forEach(category => {
        if (!selectedCategories.includes(category) || category === currentValue) {
          const option = document.createElement("option");
          option.value = category;
          option.textContent = category;
          if (category === currentValue) option.selected = true;
          select.appendChild(option);
        }
      });
    });
  };

  const addCategoryField = () => {
    if (selectedCategories.length >= availableCategories.length - 1) {
      alert("Ne možete dodati više kategorija. Dostigli ste maksimalan broj!");
      return;
    }

    const index = categoriesContainer.querySelectorAll(".form__group--block").length;
    const group = document.createElement("div");
    group.classList.add("form__group--block", "dynamic-group");

    const select = document.createElement("select");
    select.id = `categories${index}`;
    select.name = "categories[]";
    select.classList.add("form__select");
    select.required = true;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("button", "button--danger", "removeField");
    removeButton.textContent = "Izbriši";

    group.appendChild(select);
    group.appendChild(removeButton);
    categoriesContainer.appendChild(group);

    updateSelectedCategories();
    updateCategoryOptions();

    select.addEventListener("change", () => {
      updateSelectedCategories();
      updateCategoryOptions();
    });

    removeButton.addEventListener("click", () => {
      const index = selectedCategories.indexOf(select.value);
      if (index !== -1) selectedCategories.splice(index, 1);
      group.remove();
      updateSelectedCategories();
      updateCategoryOptions();
    });

    select.addEventListener("change", refreshItems);
  };

  addCategoryButton.addEventListener("click", addCategoryField);
  updateSelectedCategories();
  updateCategoryOptions();

  categoriesContainer.querySelectorAll(".removeField").forEach(button => {
    button.addEventListener("click", event => {
      const group = event.target.closest(".form__group--block");
      if (group) group.remove();
    });
  });

  // Referenca na container i dugme za dodavanje tagova
  const tagsContainer = document.getElementById("tagsContainer");
  const addTagButton = document.getElementById("addTag");

  // Funkcija za dodavanje novog polja za tag
  const addTagField = () => {
    const index = tagsContainer.querySelectorAll(".form__group--block").length;

    const group = document.createElement("div");
    group.classList.add("form__group--block", "dynamic-group");

    const input = document.createElement("input");
    input.type = "text";
    input.id = `tags${index}`;
    input.name = "tags[]";
    input.classList.add("form__input");
    input.required = true;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("button", "button--danger", "removeField");
    removeButton.textContent = "Izbriši";

    group.appendChild(input);
    group.appendChild(removeButton);
    tagsContainer.appendChild(group);

    removeButton.addEventListener("click", () => {
      group.remove();
    });
  };

  // Dodavanje event listener-a za "Dodajte" dugme
  addTagButton.addEventListener("click", addTagField);

  // Dodavanje listenera za postojeće "Izbriši" dugmiće
  tagsContainer.querySelectorAll(".removeField").forEach((button) => {
    button.addEventListener("click", (event) => {
      const group = event.target.closest(".form__group--block");
      if (group) group.remove();
    });
  });


  const keyWordsContainer = document.getElementById("keyWordsContainer");
  const addKeyWordButton = document.getElementById("addKeyWord");

  // Funkcija za dodavanje novog polja za ključne reči
  const addKeyWordField = () => {
    const index = keyWordsContainer.querySelectorAll(".form__group--block").length;

    const group = document.createElement("div");
    group.classList.add("form__group--block", "dynamic-group");

    const input = document.createElement("input");
    input.type = "text";
    input.id = `keyWords${index}`;
    input.name = "keyWords[]";
    input.classList.add("form__input");
    input.required = true;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("button", "button--danger", "removeField");
    removeButton.textContent = "Izbriši";

    group.appendChild(input);
    group.appendChild(removeButton);
    keyWordsContainer.appendChild(group);

    removeButton.addEventListener("click", () => {
      group.remove();
    });
  };

  // Listener na "Dodaj ključnu reč" dugme
  addKeyWordButton.addEventListener("click", addKeyWordField);

  // Listeneri za postojeća "Izbriši" dugmad
  keyWordsContainer.querySelectorAll(".removeField").forEach((button) => {
    button.addEventListener("click", (event) => {
      const group = event.target.closest(".form__group--block");
      if (group) group.remove();
    });
  });

  // Lista svih dostupnih statusa
  const availableStatuses = [
    "action",
    "featured",
    "empty",
    "normal",
    "partnership",
    "not-published"
  ];

  // Lista za praćenje izabranih statusa
  const selectedStatuses = [];

  // Reference na elemente forme
  const statusesContainer = document.getElementById("statusContainer");
  const addStatusButton = document.getElementById("addStatus");

  // Funkcija za ažuriranje izabranih statusa
  const updateSelectedStatuses = () => {
    selectedStatuses.length = 0;
    const allSelects = statusesContainer.querySelectorAll("select");
    allSelects.forEach((select) => {
      if (select.value) selectedStatuses.push(select.value);
    });
  };

  // Funkcija za ažuriranje dostupnih opcija u svim poljima
  const updateStatusOptions = () => {
    const allSelects = statusesContainer.querySelectorAll("select");
    allSelects.forEach((select) => {
      const currentValue = select.value;
      select.innerHTML = "";

      availableStatuses.forEach((status) => {
        if (!selectedStatuses.includes(status) || status === currentValue) {
          const option = document.createElement("option");
          option.value = status;
          option.textContent = status;
          if (status === currentValue) option.selected = true;
          select.appendChild(option);
        }
      });
    });
  };

  // Funkcija za dodavanje novog status polja
  const addStatusField = () => {
    if (selectedStatuses.length >= availableStatuses.length - 1) {
      alert("Ne možete dodati više statusa. Dostigli ste maksimalan broj!");
      return;
    }

    const index = statusesContainer.querySelectorAll(".form__group--block").length;
    const group = document.createElement("div");
    group.classList.add("form__group--block", "dynamic-group");

    const select = document.createElement("select");
    select.id = `status${index}`;
    select.name = "status[]";
    select.classList.add("form__select");
    select.required = true;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("button", "button--danger", "removeField");
    removeButton.textContent = "Izbriši";

    group.appendChild(select);
    group.appendChild(removeButton);
    statusesContainer.appendChild(group);

    updateSelectedStatuses();
    updateStatusOptions();

    select.addEventListener("change", () => {
      updateSelectedStatuses();
      updateStatusOptions();
    });

    removeButton.addEventListener("click", () => {
      if (select.value) {
        const index = selectedStatuses.indexOf(select.value);
        if (index !== -1) selectedStatuses.splice(index, 1);
      }
      group.remove();
      updateSelectedStatuses();
      updateStatusOptions();
    });
  };

  // Event listener za "Dodajte status"
  addStatusButton.addEventListener("click", addStatusField);

  // Inicijalno ažuriraj sve opcije
  updateSelectedStatuses();
  updateStatusOptions();

  // Listeneri za postojeće dugme "Izbriši"
  statusesContainer.querySelectorAll(".removeField").forEach((button) => {
    button.addEventListener("click", (event) => {
      const group = event.target.closest(".form__group--block");
      if (group) group.remove();
    });
  });

  const variationsContainer = document.getElementById("variations-container");
  const addVariationButton = document.getElementById("addVariation");

  const addVariationField = () => {
    const index = variationsContainer.querySelectorAll(".dynamic-group").length;
    const group = document.createElement("div");
    group.classList.add("form__group--block", "variation", "dynamic-group");

    const tempId = "new-" + Date.now();

    group.innerHTML = `
      <label for="variationSize${index}" class="form__label">Veličina:</label>
      <select id="variationSize${index}" name="variations[${index}][size]" class="form__select" required>
        ${["XS","S","M","L","XL","2XL","3XL","4XL","XS/S","S/M","M/L","L/XL","XL/2XL","2XL/3XL","3XL/4XL","Uni","26","27","28","29","30","31","32","33","34","35"]
          .map(size => `<option value="${size}">${size}</option>`).join("")}
      </select>

      <label for="variationColor${index}" class="form__label">Boja:</label>
      <input type="text" id="variationColor${index}" name="variations[${index}][color]" class="form__input" required>

      <label for="variationAmount${index}" class="form__label">Količina:</label>
      <input type="number" id="variationAmount${index}" name="variations[${index}][amount]" min="0" class="form__input" required>

      <label for="variationImage${index}" class="form__label">Slika:</label>
      <input type="file" id="variationImage${index}" name="variationImage_${tempId}" accept="image/*" class="form__file">

      <label for="variationImageDesc${index}" class="form__label">Opis slike:</label>
      <input type="text" id="variationImageDesc${index}" name="variations[${index}][imgDesc]" class="form__input" required>

      <label for="variationAction${index}" class="form__label">Na Akciji:</label>
      <select id="variationAction${index}" name="variations[${index}][onAction]" class="form__select" required>
        <option value="true">Da</option>
        <option value="false">Ne</option>
      </select>

      <input type="hidden" name="variations[${index}][variationId]" value="${tempId}">
    `;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("button", "button--danger", "removeField");
    removeButton.textContent = "Izbriši";
    removeButton.addEventListener("click", () => group.remove());

    group.appendChild(removeButton);
    variationsContainer.appendChild(group);
  };

  addVariationButton.addEventListener("click", addVariationField);

  const existingVariations = variationsContainer.querySelectorAll(".dynamic-group .removeField");
  existingVariations.forEach((button) => {
    button.addEventListener("click", (event) => {
      const group = event.target.closest(".dynamic-group");
      if (group) group.remove();
    });
  });

  let availableUpSellItems = [];
  let availableCrossSellItems = [];
  const selectedUpSellItems = [];
  const selectedCrossSellItems = [];

  const upSellContainer = document.getElementById("upSellItems-container");
  const crossSellContainer = document.getElementById("crossSellItems-container");
  const addUpSellButton = document.getElementById("addUpSellItem");
  const addCrossSellButton = document.getElementById("addCrossSellItem");
  const categoryInputs = document.querySelectorAll('select[name="categories[]"]');
  const itemId = document.getElementById("itemId")?.value;

  const fetchItemsFromDatabase = async (categories, type) => {
    if (!categories.length) return [];
    try {
      const endpoint = type === "upsell" ? "/admin/upsell-artikli" : "/admin/crosssell-artikli";
      const response = await fetch(`${endpoint}?categories=${categories}&itemId=${itemId || ""}`);
      if (!response.ok) throw new Error(`Greška prilikom učitavanja ${type} artikala`);
      return await response.json();
    } catch {
      return [];
    }
  };

  const updateSelectedItems = (container, selectedItems) => {
    selectedItems.length = 0;
    container.querySelectorAll("select").forEach(select => {
      if (select.value) selectedItems.push(select.value);
    });
  };

  const updateOptions = (container, availableItems, selectedItems) => {
    container.querySelectorAll("select").forEach(select => {
      const currentValue = select.value;
      select.innerHTML = "";
      availableItems.forEach(item => {
        if (!selectedItems.includes(item.ID.value) || item.ID.value === currentValue) {
          const option = document.createElement("option");
          option.value = item.ID.value;
          option.textContent = item.Naziv.value;
          if (item.ID.value === currentValue) option.selected = true;
          select.appendChild(option);
        }
      });
    });
  };

  const addDynamicField = (container, availableItems, selectedItems, type) => {
    // if (selectedItems.length >= availableItems.length) {
    //   alert("Dostigli ste maksimalan broj selekcija.");
    //   return;
    // }

    const group = document.createElement("div");
    group.classList.add("form__group--block", "dynamic-group");

    const label = document.createElement("label");
    label.classList.add("form__label");
    label.textContent = "Odaberite artikal:";

    const select = document.createElement("select");
    select.name = `${type}[]`;
    select.classList.add("form__select");
    select.required = true;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("button", "button--danger", "removeField");
    removeButton.textContent = "Izbriši";

    group.appendChild(label);
    group.appendChild(select);
    group.appendChild(removeButton);
    container.appendChild(group);

    const firstAvailable = availableItems.find(item => !selectedItems.includes(item.ID.value));
    if (firstAvailable) {
      selectedItems.push(firstAvailable.ID.value);
      select.value = firstAvailable.ID.value;
    }

    updateOptions(container, availableItems, selectedItems);
    if (select.value) select.setAttribute("data-prev-value", select.value);

    select.addEventListener("change", (e) => {
      const prev = e.target.getAttribute("data-prev-value");
      const current = select.value;

      if (prev && selectedItems.includes(prev)) selectedItems.splice(selectedItems.indexOf(prev), 1);
      if (current && !selectedItems.includes(current)) selectedItems.push(current);

      updateOptions(container, availableItems, selectedItems);
      select.setAttribute("data-prev-value", current);
    });

    removeButton.addEventListener("click", () => {
      const val = select.value;
      if (val) {
        const i = selectedItems.indexOf(val);
        if (i !== -1) selectedItems.splice(i, 1);
      }
      group.remove();
      updateOptions(container, availableItems, selectedItems);
    });

    updateSelectedItems(container, selectedItems);
  };

  const initializeExistingFields = (container, selectedItems, availableItems) => {
    container.querySelectorAll("select").forEach(select => {
      if (select.value && !selectedItems.includes(select.value)) {
        selectedItems.push(select.value);
        select.setAttribute("data-prev-value", select.value);

        const removeBtn = select.closest(".dynamic-group")?.querySelector(".removeField");
        if (removeBtn) {
          removeBtn.addEventListener("click", () => {
            const val = select.value;
            if (val) {
              const i = selectedItems.indexOf(val);
              if (i !== -1) selectedItems.splice(i, 1);
            }
            select.closest(".dynamic-group").remove();
            updateSelectedItems(container, selectedItems);
          });
        }

        select.addEventListener("change", (e) => {
          const prev = e.target.getAttribute("data-prev-value");
          const current = select.value;

          if (prev && selectedItems.includes(prev)) selectedItems.splice(selectedItems.indexOf(prev), 1);
          if (current && !selectedItems.includes(current)) selectedItems.push(current);

          updateOptions(container, availableItems, selectedItems);
          select.setAttribute("data-prev-value", current);
        });
      }
    });
  };

  initializeExistingFields(upSellContainer, selectedUpSellItems, availableUpSellItems);
  initializeExistingFields(crossSellContainer, selectedCrossSellItems, availableCrossSellItems);

  const refreshItems = async () => {
    const selectedCategories = Array.from(categoryInputs).map(input => input.value.trim()).filter(Boolean);
    availableUpSellItems = await fetchItemsFromDatabase(selectedCategories, "upsell");
    availableCrossSellItems = await fetchItemsFromDatabase(selectedCategories, "crosssell");

    updateOptions(upSellContainer, availableUpSellItems, selectedUpSellItems);
    updateOptions(crossSellContainer, availableCrossSellItems, selectedCrossSellItems);
  };

  addUpSellButton.addEventListener("click", () =>
    addDynamicField(upSellContainer, availableUpSellItems, selectedUpSellItems, "upSellItems")
  );

  addCrossSellButton.addEventListener("click", () =>
    addDynamicField(crossSellContainer, availableCrossSellItems, selectedCrossSellItems, "crossSellItems")
  );

  categoryInputs.forEach(input => input.addEventListener("change", refreshItems));

  if (itemId) refreshItems();

});
