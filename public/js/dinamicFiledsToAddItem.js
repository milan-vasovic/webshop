document.addEventListener("DOMContentLoaded", () => {
  // ===== KATEGORIJE =====
  const categoriesContainer = document.getElementById("categoriesContainer");
  const addCategoryButton = document.getElementById("addCategory");

  const getSelectedCategoryValues = () =>
    Array.from(categoriesContainer.querySelectorAll("select"))
      .map((sel) => sel.value)
      .filter(Boolean);

  const getCategoryOptionsFromDOM = () => {
    const seen = new Set();
    return Array.from(categoriesContainer.querySelectorAll("option"))
      .filter((opt) => {
        if (seen.has(opt.value)) return false;
        seen.add(opt.value);
        return true;
      })
      .map((opt) => ({ value: opt.value, label: opt.textContent }));
  };

  const updateCategoryOptions = () => {
    const selected = getSelectedCategoryValues();
    const allOptions = getCategoryOptionsFromDOM();

    categoriesContainer.querySelectorAll("select").forEach((select) => {
      const current = select.value;
      select.innerHTML = "";
      allOptions.forEach((opt) => {
        if (!selected.includes(opt.value) || opt.value === current) {
          const o = document.createElement("option");
          o.value = opt.value;
          o.textContent = opt.label;
          if (opt.value === current) o.selected = true;
          select.appendChild(o);
        }
      });
    });
  };

  const addCategoryField = () => {
    const selected = getSelectedCategoryValues();
    const allOptions = getCategoryOptionsFromDOM();

    if (selected.length >= allOptions.length) {
      alert("Dostigli ste maksimalan broj kategorija.");
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.classList.add("form__group-inline");

    const select = document.createElement("select");
    select.name = "categories[]";
    select.classList.add("form__select");
    select.required = true;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.classList.add("button", "button--danger", "removeField");
    removeBtn.textContent = "Izbriši";

    wrapper.appendChild(select);
    wrapper.appendChild(removeBtn);
    categoriesContainer.appendChild(wrapper);

    updateCategoryOptions();

    select.addEventListener("change", updateCategoryOptions);
    removeBtn.addEventListener("click", () => {
      wrapper.remove();
      updateCategoryOptions();
    });
  };

  addCategoryButton.addEventListener("click", addCategoryField);
  updateCategoryOptions();

  // ===================== TAGOVI =====================
  const tagsContainer = document.getElementById("tagsContainer");
  const addTagButton = document.getElementById("addTag");

  const getSelectedTags = () =>
    Array.from(tagsContainer.querySelectorAll("select"))
      .map((sel) => sel.value)
      .filter(Boolean);

  const getTagOptionsFromDOM = () => {
    const seen = new Set();
    return Array.from(tagsContainer.querySelectorAll("option"))
      .filter((opt) => {
        if (seen.has(opt.value)) return false;
        seen.add(opt.value);
        return true;
      })
      .map((opt) => ({ value: opt.value, label: opt.textContent }));
  };

  const updateTagOptions = () => {
    const selected = getSelectedTags();
    const allOptions = getTagOptionsFromDOM();

    tagsContainer.querySelectorAll("select").forEach((select) => {
      const current = select.value;
      select.innerHTML = "";
      allOptions.forEach((opt) => {
        if (!selected.includes(opt.value) || opt.value === current) {
          const o = document.createElement("option");
          o.value = opt.value;
          o.textContent = opt.label;
          if (opt.value === current) o.selected = true;
          select.appendChild(o);
        }
      });
    });
  };

  const addTagField = () => {
    const selected = getSelectedTags();
    const allOptions = getTagOptionsFromDOM();

    if (selected.length >= allOptions.length) {
      alert("Dostigli ste maksimalan broj tagova.");
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.classList.add("form__group-inline");

    const select = document.createElement("select");
    select.name = "tags[]";
    select.classList.add("form__select");
    select.required = true;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.classList.add("button", "button--danger", "removeField");
    removeBtn.textContent = "Izbriši";

    wrapper.appendChild(select);
    wrapper.appendChild(removeBtn);
    tagsContainer.appendChild(wrapper);

    updateTagOptions();

    select.addEventListener("change", updateTagOptions);
    removeBtn.addEventListener("click", () => {
      wrapper.remove();
      updateTagOptions();
    });
  };

  addTagButton.addEventListener("click", addTagField);
  updateTagOptions();

  const keyWordsContainer = document.getElementById("keyWordsContainer");
  const addKeyWordButton = document.getElementById("addKeyWord");

  // Funkcija za dodavanje novog polja za ključne reči
  const addKeyWordField = () => {
    const index = keyWordsContainer.querySelectorAll(
      ".form__group--block"
    ).length;

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
    "not-published",
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

    const index = statusesContainer.querySelectorAll(
      ".form__group--block"
    ).length;
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
  const tempId = "new-" + Date.now();

  // Glavni wrapper
  const group = document.createElement("div");
  group.classList.add("form__group--block", "variation", "variation__container", "dynamic-group");

  // Grid koji drži inpute
  const grid = document.createElement("div");
  grid.classList.add("variation__grid");

  const sizes = ["XS","S","M","L","XL","2XL","3XL","4XL","XS/S","S/M","M/L","L/XL","XL/2XL","2XL/3XL","3XL/4XL","Uni","26","27","28","29","30","31","32","33","34","35"];

  // Helper za dodavanje polja
  const createField = (html, extraClass = "") => {
    const div = document.createElement("div");
    div.classList.add("variation__field");
    if (extraClass) div.classList.add(extraClass);
    div.innerHTML = html;
    return div;
  };

  grid.appendChild(createField(`
    <label for="variationSize${index}" class="form__label">Veličina:</label>
    <select id="variationSize${index}" name="variations[${index}][size]" class="form__select" required>
      ${sizes.map(size => `<option value="${size}">${size}</option>`).join("")}
    </select>
  `));

  grid.appendChild(createField(`
    <label for="variationColor${index}" class="form__label">Boja:</label>
    <input type="text" id="variationColor${index}" name="variations[${index}][color]" class="form__input" required>
  `));

  grid.appendChild(createField(`
    <label for="variationAmount${index}" class="form__label">Količina:</label>
    <input type="number" id="variationAmount${index}" name="variations[${index}][amount]" min="0" class="form__input" required>
  `));

  grid.appendChild(createField(`
    <label for="variationAction${index}" class="form__label">Na Akciji:</label>
    <select id="variationAction${index}" name="variations[${index}][onAction]" class="form__select" required>
      <option value="true">Da</option>
      <option value="false">Ne</option>
    </select>
  `));

  grid.appendChild(createField(`
    <label for="variationImage${index}" class="form__label">Slika:</label>
    <input type="file" id="variationImage${index}" name="variationImage_${tempId}" class="form__file" accept="image/*">
  `, "variation__file"));

  grid.appendChild(createField(`
    <label for="variationImageDesc${index}" class="form__label">Opis slike:</label>
    <input type="text" id="variationImageDesc${index}" name="variations[${index}][imgDesc]" class="form__input" required>
  `));

  // Dodaj grid u group
  group.appendChild(grid);

  // Hidden ID
  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.name = `variations[${index}][variationId]`;
  hidden.value = tempId;
  group.appendChild(hidden);

  // Dugme za brisanje
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.classList.add("button", "button--danger", "removeField");
  removeButton.textContent = "Izbriši";
  removeButton.addEventListener("click", () => group.remove());
  group.appendChild(removeButton);

  // Ubaci sve
  variationsContainer.appendChild(group);
};

addVariationButton.addEventListener("click", addVariationField);

// Omogući brisanje postojećih
variationsContainer.querySelectorAll(".dynamic-group .removeField").forEach((button) => {
  button.addEventListener("click", (event) => {
    const group = event.target.closest(".dynamic-group");
    if (group) group.remove();
  });
});


  const upSellContainer = document.getElementById("upSellItems-container");
  const crossSellContainer = document.getElementById(
    "crossSellItems-container"
  );
  const addUpSellButton = document.getElementById("addUpSellItem");
  const addCrossSellButton = document.getElementById("addCrossSellItem");
  const categoryInputs = document.querySelectorAll(
    'select[name="categories[]"]'
  );
  const itemId = document.querySelector('input[name="itemId"]')?.value || "";

  let availableUpSellItems = [];
  let availableCrossSellItems = [];
  const selectedUpSell = [];
  const selectedCrossSell = [];

  const fetchRelationItems = async (type) => {
    const categories = Array.from(categoryInputs)
      .map((sel) => sel.value)
      .filter(Boolean);
    if (!categories.length) return [];

    try {
      const endpoint =
        type === "upsell"
          ? "/admin/upsell-artikli"
          : "/admin/crosssell-artikli";
      const url = `${endpoint}?categories=${encodeURIComponent(
        categories.join(",")
      )}&itemId=${itemId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Greška pri učitavanju artikala");
      return await response.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const updateSelectOptions = (container, items, selected) => {
    const itemMap = new Map(items.map((i) => [i.ID.value, i.Naziv.value]));

    container.querySelectorAll("select").forEach((select) => {
      const currentValue = select.value;
      select.innerHTML = "";

      items.forEach((item) => {
        if (
          !selected.includes(item.ID.value) ||
          item.ID.value === currentValue
        ) {
          const o = document.createElement("option");
          o.value = item.ID.value;
          o.textContent = item.Naziv.value;
          if (item.ID.value === currentValue) o.selected = true;
          select.appendChild(o);
        }
      });

      // Remove select if the previously selected item no longer exists
      if (currentValue && !itemMap.has(currentValue)) {
        const wrapper = select.closest(".dynamic-group");
        if (wrapper) wrapper.remove();
      }
    });
  };

  const addRelationField = (container, items, selected, name) => {
    const currentSelected = Array.from(
      container.querySelectorAll("select")
    ).map((s) => s.value);
    if (currentSelected.length >= items.length) {
      alert("Nema više dostupnih artikala za izbor.");
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.classList.add("form__group-inline");

    const select = document.createElement("select");
    select.name = `${name}[]`;
    select.classList.add("form__select");
    select.required = true;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.classList.add("button", "button--danger", "removeField");
    removeBtn.textContent = "Izbriši";

    wrapper.appendChild(select);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);

    const firstAvailable = items.find((i) => !selected.includes(i.ID.value));
    if (firstAvailable) {
      select.value = firstAvailable.ID.value;
      selected.push(firstAvailable.ID.value);
      select.setAttribute("data-prev-value", firstAvailable.ID.value);
    }

    updateSelectOptions(container, items, selected);

    select.addEventListener("change", () => {
      const prev = select.getAttribute("data-prev-value");
      const current = select.value;

      if (prev && selected.includes(prev))
        selected.splice(selected.indexOf(prev), 1);
      if (current && !selected.includes(current)) selected.push(current);

      updateSelectOptions(container, items, selected);
      select.setAttribute("data-prev-value", current);
    });

    removeBtn.addEventListener("click", () => {
      const val = select.value;
      if (val && selected.includes(val))
        selected.splice(selected.indexOf(val), 1);
      wrapper.remove();
      updateSelectOptions(container, items, selected);
    });
  };

  const refreshRelationItems = async () => {
    availableUpSellItems = await fetchRelationItems("upsell");
    availableCrossSellItems = await fetchRelationItems("crosssell");

    updateSelectOptions(upSellContainer, availableUpSellItems, selectedUpSell);
    updateSelectOptions(
      crossSellContainer,
      availableCrossSellItems,
      selectedCrossSell
    );
  };

  addUpSellButton.addEventListener("click", () =>
    addRelationField(
      upSellContainer,
      availableUpSellItems,
      selectedUpSell,
      "upSellItems"
    )
  );

  addCrossSellButton.addEventListener("click", () =>
    addRelationField(
      crossSellContainer,
      availableCrossSellItems,
      selectedCrossSell,
      "crossSellItems"
    )
  );

  categoryInputs.forEach((input) =>
    input.addEventListener("change", () => {
      refreshRelationItems();
    })
  );

  // Pronađi već selektovane UpSell artikle i ubaci ih u selectedUpSell
  upSellContainer.querySelectorAll("select").forEach((select) => {
    const value = select.value;
    if (value && !selectedUpSell.includes(value)) {
      selectedUpSell.push(value);
      select.setAttribute("data-prev-value", value);
    }
  });

  // Isto i za CrossSell
  crossSellContainer.querySelectorAll("select").forEach((select) => {
    const value = select.value;
    if (value && !selectedCrossSell.includes(value)) {
      selectedCrossSell.push(value);
      select.setAttribute("data-prev-value", value);
    }
  });
  
  if (itemId) refreshRelationItems();

  // === Postojeća dugmad za brisanje kategorija ===
  categoriesContainer.querySelectorAll(".removeField").forEach((button) => {
    button.addEventListener("click", (event) => {
      const group = event.target.closest(".form__group-inline");
      if (group) group.remove();
      updateCategoryOptions();
    });
  });

  // === Postojeća dugmad za brisanje tagova ===
  tagsContainer.querySelectorAll(".removeField").forEach((button) => {
    button.addEventListener("click", (event) => {
      const group = event.target.closest(".form__group-inline");
      if (group) group.remove();
      updateTagOptions();
    });
  });

  // === Postojeća dugmad za brisanje upSell/crossSell ===
  upSellContainer.querySelectorAll(".removeField").forEach((button) => {
    button.addEventListener("click", (event) => {
      const group = event.target.closest(".form__group-inline");
      if (group) group.remove();
      updateSelectOptions(
        upSellContainer,
        availableUpSellItems,
        selectedUpSell
      );
    });
  });

  crossSellContainer.querySelectorAll(".removeField").forEach((button) => {
    button.addEventListener("click", (event) => {
      const group = event.target.closest(".form__group-inline");
      if (group) group.remove();
      updateSelectOptions(
        crossSellContainer,
        availableCrossSellItems,
        selectedCrossSell
      );
    });
  });
});

// Omogućavanje brisanja postojećih "Izbriši" dugmadi za Ključne Reči i Status
document
  .querySelectorAll(
    "#keyWordsContainer .removeField, #statusContainer .removeField"
  )
  .forEach((button) => {
    button.addEventListener("click", (event) => {
      const group = event.target.closest(".form__group-inline");
      if (group) group.remove();
    });
  });
