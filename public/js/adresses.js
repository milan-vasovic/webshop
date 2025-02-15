document.addEventListener("DOMContentLoaded", () => {
    const addAddressButton = document.querySelector(".tab-content[data-tab='Adrese'] button.btn");
    const newAddressContainer = document.getElementById("newAddres");

    // Dohvati CSRF token iz hidden inputa
    const csrfToken = document.getElementById("csrfToken").value;

    // Brojač za dinamičke ID-eve
    let addressIndex = 0;

    // Funkcija za dodavanje polja za unos adrese
    const addAddressField = () => {
        const form = document.createElement("form");
        form.classList.add("address-form", "main-form");
        form.action = "/korisnik/dodajte-adresu";
        form.method = "POST";

        // 📍 Kreiranje polja sa jedinstvenim ID-evima
        const cityGroup = createInputField("text", `city${addressIndex}`, "city", "Grad", "Unesite grad");
        const streetGroup = createInputField("text", `street${addressIndex}`, "street", "Ulica", "Unesite ulicu");
        const numberGroup = createInputField("text", `number${addressIndex}`, "number", "Broj", "Unesite broj");
        const postalCodeGroup = createInputField("text", `postalCode${addressIndex}`, "postalCode", "Poštanski kod", "Unesite poštanski kod (opciono)", false);

        // Hidden CSRF token input
        const csrfInput = document.createElement("input");
        csrfInput.type = "hidden";
        csrfInput.name = "CSRFToken";
        csrfInput.value = csrfToken;

        // Dugme za brisanje
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Izbriši";
        removeButton.classList.add("btn", "btn-danger");

        // Dugme za slanje forme
        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "Dodajte";
        submitButton.classList.add("btn", "btn-success");

        // 📌 Dodavanje elemenata u formu
        form.appendChild(cityGroup);
        form.appendChild(streetGroup);
        form.appendChild(numberGroup);
        form.appendChild(postalCodeGroup);
        form.appendChild(csrfInput);
        form.appendChild(removeButton);
        form.appendChild(submitButton);
        newAddressContainer.appendChild(form);

        // Event listener za brisanje forme
        removeButton.addEventListener("click", () => {
            form.remove();
        });

        // Event listener za slanje forme
        form.addEventListener("submit", async (event) => {
            event.preventDefault(); // Sprečava podrazumevano slanje forme

            try {
                const formData = new FormData(form);
                const response = await fetch(form.action, {
                    method: form.method,
                    body: formData
                });

                const result = await response.json(); // Dobijamo odgovor iz backenda

                if (!response.ok) {
                    throw new Error(result.error || "Greška prilikom dodavanja adrese!");
                }

                alert(result.message);
                window.location.reload(); // 🔄 Osvežava stranicu nakon uspešnog dodavanja!
            } catch (error) {
                alert(error.message); // Prikazuje grešku korisniku
            }
        });

        addressIndex++; // Povećavamo ID za sledeći unos
    };

    // Event listener za dodavanje polja na klik
    addAddressButton.addEventListener("click", addAddressField);

    // Pomoćna funkcija za kreiranje input polja unutar div-a sa jedinstvenim ID-em
    function createInputField(type, id, name, labelText, placeholder, required = true) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("main-form__group"); // ✅ Dodajemo klasu

        const label = document.createElement("label");
        label.textContent = labelText;
        label.setAttribute("for", id); // ⚡ Ispravno povezivanje labele sa inputom

        const input = document.createElement("input");
        input.type = type;
        input.id = id; // ⚡ Postavljamo jedinstven ID
        input.name = name;
        input.required = required;
        input.placeholder = placeholder;
        input.classList.add("main-form__input");

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        return wrapper;
    }
});
