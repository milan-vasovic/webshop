document.addEventListener("DOMContentLoaded", () => {
    const addPhoneButton = document.querySelector(".tab-content.active button.btn");
    const newTelephoneContainer = document.getElementById("newTelephone");

    // Dohvati CSRF token iz hidden inputa
    const csrfToken = document.getElementById("csrfToken").value;

    const addPhoneField = () => {
        const form = document.createElement("form");
        form.classList.add("phone-form");
        form.action = "/korisnik/dodajte-broj";
        form.method = "POST";

        // Input za telefon
        const input = document.createElement("input");
        input.type = "tel";
        input.name = "telephone";
        input.required = true;
        input.placeholder = "Unesite broj telefona";
        input.classList.add("main-form__input");

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

        // Dugme za slanje
        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "Dodajte";
        submitButton.classList.add("btn", "btn-success");

        // Dodavanje elemenata u formu
        form.appendChild(input);
        form.appendChild(csrfInput);
        form.appendChild(removeButton);
        form.appendChild(submitButton);
        newTelephoneContainer.appendChild(form);

        // Event listener za brisanje pojedinačne forme
        removeButton.addEventListener("click", () => {
            form.remove();
        });

        // Event listener za slanje forme
        form.addEventListener("submit", async (event) => {
            event.preventDefault(); // Sprečava podrazumevano slanje

            try {
                const formData = new FormData(form);
                const response = await fetch(form.action, {
                    method: form.method,
                    body: formData
                });

                const result = await response.json(); // Dobijamo odgovor iz backenda

                if (!response.ok) {
                    throw new Error(result.error || "Greška prilikom dodavanja broja!");
                }

                alert(result.message);
                window.location.reload(); // 🔄 Osvežava stranicu nakon uspešnog dodavanja!
            } catch (error) {
                alert(error.message); // Prikazuje grešku korisniku
            }
        });
    };

    // Event listener za dodavanje polja na klik
    addPhoneButton.addEventListener("click", addPhoneField);
});
