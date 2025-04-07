document.addEventListener('DOMContentLoaded', () => {
    // Lista svih dostupnih kategorija
    const availableCategories = [
        "Odeća", "Helanke", "Trenerke", "Fitness", "Kompleti", 
        "Majice", "Farmerice", "Pantalone", "Šorc", "Haljine", 
        "Suknje", "Kardigani", "Jakne", "Muško", "Žensko", 
        "Kupaći Kostimi Jednodelni", "Kupaći Kostimi Dvodelni", 
        "Zimsko", "Letnje", "Prolećno", "Jesenje", "Veš"
    ];

    // Lista za praćenje izabranih kategorija
    const selectedCategories = [];

    // Reference na elemente forme
    const categoriesContainer = document.getElementById('categoriesContainer');
    const addCategoryButton = document.getElementById('addCategory');

    // Funkcija za ažuriranje izabranih kategorija
    const updateSelectedCategories = () => {
        // Resetujemo listu i ponovo je popunjavamo iz forme
        selectedCategories.length = 0; 
        const allSelects = categoriesContainer.querySelectorAll('select');
        allSelects.forEach(select => {
            if (select.value) {
                selectedCategories.push(select.value);
            }
        });
    };

    // Funkcija za ažuriranje dostupnih opcija u svim poljima
    const updateCategoryOptions = () => {
        const allSelects = categoriesContainer.querySelectorAll('select');
        allSelects.forEach(select => {
            const currentValue = select.value; // Trenutno selektovana vrednost
            select.innerHTML = ``; // Reset opcija

            availableCategories.forEach(category => {
                // Prikazujemo samo dostupne kategorije ili trenutno selektovanu vrednost
                if (!selectedCategories.includes(category) || category === currentValue) {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    if (category === currentValue) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
            });
        });
    };

    // Funkcija za dodavanje nove kategorije
    const addCategoryField = () => {
        // Provera: Da li možemo da dodamo novu kategoriju?
        if (selectedCategories.length >= availableCategories.length - 1) {
            console.warn('Nema više dostupnih kategorija za dodavanje.');
            alert('Ne možete dodati više kategorija. Dostigli ste maksimalan broj!');
            return;
        }

        // Kreiranje novog polja za kategoriju
        const index = categoriesContainer.querySelectorAll('.dynamic-group').length;
        const group = document.createElement('div');
        group.classList.add('dynamic-group');

        const select = document.createElement('select');
        select.id = `categories${index}`;
        select.name = 'categories[]';
        select.classList.add('main-form__select');
        select.required = true;

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('btn', 'btn-danger', 'removeField');
        removeButton.textContent = 'Izbriši';

        group.appendChild(select);
        group.appendChild(removeButton);
        categoriesContainer.appendChild(group);

        // Ažuriranje opcija za novododato polje
        updateSelectedCategories();
        updateCategoryOptions();

        // Event za promenu selektovane vrednosti
        select.addEventListener('change', () => {
            updateSelectedCategories();
            updateCategoryOptions();
        });

        // Event za brisanje polja
        removeButton.addEventListener('click', () => {
            if (select.value) {
                // Ukloni vrednost kategorije iz liste `selectedCategories`
                const index = selectedCategories.indexOf(select.value);
                if (index !== -1) {
                    selectedCategories.splice(index, 1); // Ukloni izabranu kategoriju
                }
            }
            group.remove();
            updateSelectedCategories();
            updateCategoryOptions();
        });

        select.addEventListener('change', refreshItems);
    };

    // Event listener za dugme "Dodaj kategoriju"
    addCategoryButton.addEventListener('click', addCategoryField);

    // Inicijalno ažuriranje opcija u postojećim poljima
    updateSelectedCategories();
    updateCategoryOptions();

    const existingCategories = categoriesContainer.querySelectorAll('.dynamic-group .removeField');
    existingCategories.forEach(button => {
        button.addEventListener('click', (event) => {
            const group = event.target.closest('.dynamic-group');
            if (group) group.remove();
        });
    });

    // Referenca na container i dugme za dodavanje tagova
    const tagsContainer = document.getElementById('tagsContainer');
    const addTagButton = document.getElementById('addTag');
    
    // Funkcija za dodavanje novog polja za tag
    const addTagField = () => {
        // Kreiramo novu grupu za dinamičko polje
        const index = tagsContainer.querySelectorAll('.dynamic-group').length;
        const group = document.createElement('div');
        group.classList.add('dynamic-group');
    
        // Kreiramo input polje za tag
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `tags${index}`;
        input.name = 'tags[]';
        input.classList.add('main-form__input');
        input.required = true;
    
        // Kreiramo dugme za brisanje
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('btn', 'btn-danger', 'removeField');
        removeButton.textContent = 'Izbriši';
    
        // Dodajemo input i dugme u grupu
        group.appendChild(input);
        group.appendChild(removeButton);
        tagsContainer.appendChild(group);
    
        // Dodajemo listener za dugme za brisanje
        removeButton.addEventListener('click', () => {
            group.remove();
        });
    };
    
    // Dodajemo listener na dugme za dodavanje
    addTagButton.addEventListener('click', addTagField);
    
    // Prolazimo kroz već postojeće tagove (ako ih ima) i dodajemo listener za brisanje
    const existingTags = tagsContainer.querySelectorAll('.dynamic-group .removeField');
    existingTags.forEach(button => {
        button.addEventListener('click', (event) => {
            const group = event.target.closest('.dynamic-group');
            if (group) group.remove();
        });
    });

    const keyWordsContainer = document.getElementById('keyWordsContainer');
    const addKeyWordButton = document.getElementById('addKeyWord');

    // Funkcija za dodavanje novog polja za ključne reči
    const addKeyWordField = () => {
        // Kreiramo novu grupu za dinamičko polje
        const index = keyWordsContainer.querySelectorAll('.dynamic-group').length;
        const group = document.createElement('div');
        group.classList.add('dynamic-group');

        // Kreiramo input polje za ključnu reč
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `keyWords${index}`;
        input.name = 'keyWords[]';
        input.classList.add('main-form__input');
        input.required = true;

        // Kreiramo dugme za brisanje
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('btn', 'btn-danger', 'removeField');
        removeButton.textContent = 'Izbriši';

        // Dodajemo input i dugme u grupu
        group.appendChild(input);
        group.appendChild(removeButton);
        keyWordsContainer.appendChild(group);

        // Dodajemo listener za dugme za brisanje
        removeButton.addEventListener('click', () => {
            group.remove();
        });
    };

    // Dodajemo listener na dugme za dodavanje ključnih reči
    addKeyWordButton.addEventListener('click', addKeyWordField);

    // Prolazimo kroz već postojeće ključne reči (ako ih ima) i dodajemo listener za brisanje
    const existingKeyWords = keyWordsContainer.querySelectorAll('.dynamic-group .removeField');
    existingKeyWords.forEach(button => {
        button.addEventListener('click', (event) => {
            const group = event.target.closest('.dynamic-group');
            if (group) group.remove();
        });
    });

    // Lista svih dostupnih statusa
    const availableStatuses = ["action", "featured", "empty", "normal", "partnership"];

    // Lista za praćenje izabranih statusa
    const selectedStatuses = [];

    // Reference na elemente forme
    const statusesContainer = document.getElementById('statusContainer');
    const addStatusButton = document.getElementById('addStatus');

    // Funkcija za ažuriranje izabranih statusa
    const updateSelectedStatuses = () => {
        // Resetujemo listu i ponovo je popunjavamo iz forme
        selectedStatuses.length = 0; 
        const allSelects = statusesContainer.querySelectorAll('select');
        allSelects.forEach(select => {
            if (select.value) {
                selectedStatuses.push(select.value);
            }
        });
    };

    // Funkcija za ažuriranje dostupnih opcija u svim poljima
    const updateStatusOptions = () => {
        const allSelects = statusesContainer.querySelectorAll('select');
        allSelects.forEach(select => {
            const currentValue = select.value; // Trenutno selektovana vrednost
            select.innerHTML = ``; // Reset opcija

            availableStatuses.forEach(status => {
                // Prikazujemo samo dostupne statuse ili trenutno selektovanu vrednost
                if (!selectedStatuses.includes(status) || status === currentValue) {
                    const option = document.createElement('option');
                    option.value = status;
                    option.textContent = status;
                    if (status === currentValue) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
            });
        });
    };

    // Funkcija za dodavanje novog statusa
    const addStatusField = () => {
        // Provera: Da li možemo da dodamo novi status?
        if (selectedStatuses.length >= availableStatuses.length - 1) {
            alert('Ne možete dodati više statusa. Dostigli ste maksimalan broj!');
            return;
        }

        // Kreiranje novog polja za status
        const index = statusesContainer.querySelectorAll('.dynamic-group').length;
        const group = document.createElement('div');
        group.classList.add('dynamic-group');

        const select = document.createElement('select');
        select.id = `status${index}`;
        select.name = 'status[]';
        select.classList.add('main-form__select');
        select.required = true;

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('btn-danger', 'removeField');
        removeButton.textContent = 'Izbriši';

        group.appendChild(select);
        group.appendChild(removeButton);
        statusesContainer.appendChild(group);

        // Ažuriranje opcija za novododato polje
        updateSelectedStatuses();
        updateStatusOptions();

        // Event za promenu selektovane vrednosti
        select.addEventListener('change', () => {
            updateSelectedStatuses();
            updateStatusOptions();
        });

        // Event za brisanje polja
        removeButton.addEventListener('click', () => {
            if (select.value) {
                // Ukloni vrednost statusa iz liste `selectedStatuses`
                const index = selectedStatuses.indexOf(select.value);
                if (index !== -1) {
                    selectedStatuses.splice(index, 1); // Ukloni izabrani status
                }
            }
            group.remove();
            updateSelectedStatuses();
            updateStatusOptions();
        });
    };

    // Event listener za dugme "Dodaj status"
    addStatusButton.addEventListener('click', addStatusField);

    // Inicijalno ažuriranje opcija u postojećim poljima
    updateSelectedStatuses();
    updateStatusOptions();

    const existingStatuses = statusesContainer.querySelectorAll('.dynamic-group .removeField');
    existingStatuses.forEach(button => {
        button.addEventListener('click', (event) => {
            const group = event.target.closest('.dynamic-group');
            if (group) group.remove();
        });
    });

    const variationsContainer = document.getElementById('variations-container');
    const addVariationButton = document.getElementById('addVariation');
    
    // Funkcija za dodavanje nove varijacije
    const addVariationField = () => {
      // Broj već postojećih varijacija kao indeks
      const index = variationsContainer.querySelectorAll('.dynamic-group').length;
      
      // Kreiranje wrapper div-a za novu varijaciju
      const group = document.createElement('div');
      group.classList.add('variation', 'dynamic-group');
    
      // Kreiraj privremeni ID, na primer: "new-" + timestamp
      const tempId = "new-" + Date.now();
    
      // Skriveno polje za privremeni ID varijacije
      const variationIdInput = document.createElement('input');
      variationIdInput.type = 'hidden';
      variationIdInput.name = `variations[${index}][variationId]`;
      variationIdInput.value = tempId;
    
      // Label i select za veličinu
      const sizeLabel = document.createElement('label');
      sizeLabel.textContent = 'Veličina:';
      sizeLabel.setAttribute('for', `variationSize${index}`);
      sizeLabel.classList.add('main-form__label');
    
      const sizeSelect = document.createElement('select');
      sizeSelect.id = `variationSize${index}`;
      sizeSelect.name = `variations[${index}][size]`;
      sizeSelect.classList.add('main-form__select');
      sizeSelect.required = true;
    
      const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "S/M", "M/L", "L/XL", "XL/2XL", "2XL/3XL", "3XL/4XL", "Uni", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35"];
      sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        sizeSelect.appendChild(option);
      });
    
      // Input za boju
      const colorLabel = document.createElement('label');
      colorLabel.textContent = 'Boja:';
      colorLabel.setAttribute('for', `variationColor${index}`);
      colorLabel.classList.add('main-form__label');
    
      const colorInput = document.createElement('input');
      colorInput.type = 'text';
      colorInput.id = `variationColor${index}`;
      colorInput.name = `variations[${index}][color]`;
      colorInput.classList.add('main-form__input');
      colorInput.required = true;
    
      // Input za količinu
      const amountLabel = document.createElement('label');
      amountLabel.textContent = 'Količina:';
      amountLabel.setAttribute('for', `variationAmount${index}`);
      amountLabel.classList.add('main-form__label');
    
      const amountInput = document.createElement('input');
      amountInput.type = 'number';
      amountInput.id = `variationAmount${index}`;
      amountInput.name = `variations[${index}][amount]`;
      amountInput.classList.add('main-form__input');
      amountInput.min = '0';
      amountInput.required = true;
    
      // Input za sliku – preimenuj file input tako da uključuje tempId
      const imageLabel = document.createElement('label');
      imageLabel.textContent = 'Slika:';
      imageLabel.setAttribute('for', `variationImage${index}`);
      imageLabel.classList.add('main-form__label');
    
      const imageInput = document.createElement('input');
      imageInput.type = 'file';
      imageInput.id = `variationImage${index}`;
      // Ime file inputa sadrži privremeni ID, npr. "variationImage_new-<timestamp>"
      imageInput.name = `variationImage_${tempId}`;
      imageInput.classList.add('main-form__file');
      imageInput.accept = 'image/*';
    
      // Input za opis slike
      const imageDescLabel = document.createElement('label');
      imageDescLabel.textContent = 'Opis slike:';
      imageDescLabel.setAttribute('for', `variationImageDesc${index}`);
      imageDescLabel.classList.add('main-form__label');
    
      const imageDescInput = document.createElement('input');
      imageDescInput.type = 'text';
      imageDescInput.id = `variationImageDesc${index}`;
      imageDescInput.name = `variations[${index}][imgDesc]`;
      imageDescInput.classList.add('main-form__input');
      imageDescInput.required = true;
    
      // Dugme za brisanje polja
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.classList.add('btn-danger', 'removeField');
      removeButton.textContent = 'Izbriši';
      removeButton.addEventListener('click', () => {
        group.remove();
      });
    
      // Sklapanje svih elemenata u grupu
      group.appendChild(sizeLabel);
      group.appendChild(sizeSelect);
      group.appendChild(colorLabel);
      group.appendChild(colorInput);
      group.appendChild(amountLabel);
      group.appendChild(amountInput);
      group.appendChild(imageLabel);
      group.appendChild(imageInput);
      group.appendChild(imageDescLabel);
      group.appendChild(imageDescInput);
      group.appendChild(variationIdInput);
      group.appendChild(removeButton);
    
      // Dodavanje grupe u container
      variationsContainer.appendChild(group);
    }; 

    // Event listener za dugme "Dodajte"
    addVariationButton.addEventListener('click', addVariationField);

    const existingVariations = variationsContainer.querySelectorAll('.dynamic-group .removeField');
    existingVariations.forEach(button => {
        button.addEventListener('click', (event) => {
            const group = event.target.closest('.dynamic-group');
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
    
    // Function to fetch items from the database
    const fetchItemsFromDatabase = async (categories, type) => {
        if (!categories.length) return [];
        try {
            const endpoint =
                type === "upsell"
                    ? "/admin/upsell-artikli"
                    : "/admin/crosssell-artikli";
            const response = await fetch(
                `${endpoint}?categories=${categories}&itemId=${itemId || ""}`
            );
            if (!response.ok) throw new Error(`Error fetching ${type} items`);
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    };
    
    // Function to update selected items
    const updateSelectedItems = (container, selectedItems) => {
        selectedItems.length = 0;
        const selects = container.querySelectorAll("select");
        selects.forEach((select) => {
            if (select.value) selectedItems.push(select.value);
        });
    };
    
    // Function to update options in all select fields
    const updateOptions = (container, availableItems, selectedItems) => {
        const allSelects = container.querySelectorAll("select");
        allSelects.forEach((select) => {
            const currentValue = select.value;
            select.innerHTML = "";
            availableItems.forEach((item) => {
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
    
    // Function to add a new dynamic field
    const addDynamicField = (container, availableItems, selectedItems, type) => {
        if (selectedItems.length >= availableItems.length) {
            alert("You have reached the maximum number of selections.");
            return;
        }
    
        const group = document.createElement("div");
        group.classList.add("dynamic-group");
    
        const select = document.createElement("select");
        select.name = `${type}[]`;
        select.classList.add("main-form__select");
        select.required = true;
    
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.classList.add("btn", "btn-danger", "removeField");
        removeButton.textContent = "Izbrišite";
    
        group.appendChild(select);
        group.appendChild(removeButton);
        container.appendChild(group);
    
        const firstAvailableItem = availableItems.find(
            (item) => !selectedItems.includes(item.ID.value)
        );
    
        if (firstAvailableItem) {
            const firstValue = firstAvailableItem.ID.value;
            selectedItems.push(firstValue);
            select.value = firstValue;
        }
    
        updateOptions(container, availableItems, selectedItems);
    
        if (select.value) {
            select.setAttribute("data-prev-value", select.value);
        }
    
        select.addEventListener("change", (event) => {
            const prevValue = event.target.getAttribute("data-prev-value");
            const newValue = select.value;
    
            if (prevValue && selectedItems.includes(prevValue)) {
                const index = selectedItems.indexOf(prevValue);
                if (index !== -1) selectedItems.splice(index, 1);
            }
    
            if (newValue && !selectedItems.includes(newValue)) {
                selectedItems.push(newValue);
            }
    
            updateOptions(container, availableItems, selectedItems);
            event.target.setAttribute("data-prev-value", newValue);
        });
    
        removeButton.addEventListener("click", () => {
            const value = select.value;
            if (value) {
                const index = selectedItems.indexOf(value);
                if (index !== -1) selectedItems.splice(index, 1);
            }
            group.remove();
            updateOptions(container, availableItems, selectedItems);
        });
    
        updateSelectedItems(container, selectedItems);
    };
    
    // Function to initialize existing fields
    const initializeExistingFields = (container, selectedItems) => {
        const allSelects = container.querySelectorAll("select");
        allSelects.forEach((select) => {
            if (select.value && !selectedItems.includes(select.value)) {
                selectedItems.push(select.value);
                select.setAttribute("data-prev-value", select.value);
    
                const removeButton = select
                    .closest(".dynamic-group")
                    ?.querySelector(".removeField");
                if (removeButton) {
                    removeButton.addEventListener("click", () => {
                        const value = select.value;
                        if (value) {
                            const index = selectedItems.indexOf(value);
                            if (index !== -1) selectedItems.splice(index, 1);
                        }
                        select.closest(".dynamic-group").remove();
                        updateSelectedItems(container, selectedItems);
                    });
                }
    
                select.addEventListener("change", (event) => {
                    const prevValue = event.target.getAttribute("data-prev-value");
                    const newValue = select.value;
    
                    if (prevValue && selectedItems.includes(prevValue)) {
                        const index = selectedItems.indexOf(prevValue);
                        if (index !== -1) selectedItems.splice(index, 1);
                    }
    
                    if (newValue && !selectedItems.includes(newValue)) {
                        selectedItems.push(newValue);
                    }
    
                    updateOptions(container, availableItems, selectedItems);
                    event.target.setAttribute("data-prev-value", newValue);
                });
            }
        });
    };
    
    initializeExistingFields(upSellContainer, selectedUpSellItems);
    initializeExistingFields(crossSellContainer, selectedCrossSellItems);
    
    // Refresh items when categories change
    const refreshItems = async () => {
        const selectedCategories = Array.from(categoryInputs)
            .map((input) => input.value.trim())
            .filter(Boolean);

        availableUpSellItems = await fetchItemsFromDatabase(selectedCategories, "upsell");
        availableCrossSellItems = await fetchItemsFromDatabase(selectedCategories, "crosssell");
    
        updateOptions(upSellContainer, availableUpSellItems, selectedUpSellItems);
        updateOptions(crossSellContainer, availableCrossSellItems, selectedCrossSellItems);
    };
    
    // Add event listeners
    addUpSellButton.addEventListener("click", () =>
        addDynamicField(upSellContainer, availableUpSellItems, selectedUpSellItems, "upSellItems")
    );
    
    addCrossSellButton.addEventListener("click", () =>
        addDynamicField(
            crossSellContainer,
            availableCrossSellItems,
            selectedCrossSellItems,
            "crossSellItems"
        )
    );
    
    categoryInputs.forEach((input) => input.addEventListener("change", refreshItems));
    
    // Refresh items on page load
    if (itemId) refreshItems();
    
});