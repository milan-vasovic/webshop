document.addEventListener("DOMContentLoaded", () => {
  // Selektuj dugme za upravljanje i formu
  const toggleButton = document.getElementById("toggleBtn");
  const form = document.getElementById("statusForm"); // pretpostavljamo da je ovo tvoja forma
  const statusSelect = document.getElementById("statusSelect");

  // Kreiraj element za unos novog ID-a porudžbine (sakriven na početku)
  const newOrderFieldWrapper = document.createElement("div");
  newOrderFieldWrapper.classList.add("main-form__group");
  newOrderFieldWrapper.style.display = "none"; // sakriveno na početku

  const newOrderLabel = document.createElement("label");
  newOrderLabel.classList.add("main-form__label");
  newOrderLabel.setAttribute("for", "newOrderId");
  newOrderLabel.textContent = "Novi ID porudžbine:";

  const newOrderInput = document.createElement("input");
  newOrderInput.type = "text";
  newOrderInput.id = "newOrderId";
  newOrderInput.name = "newOrderId";
  newOrderInput.classList.add("main-form__input");
  // Početno nema required – dodaćemo ga ako se izabere "sent-exchange"
  newOrderInput.required = false;

  newOrderFieldWrapper.appendChild(newOrderLabel);
  newOrderFieldWrapper.appendChild(newOrderInput);

  // Ubaci novo polje ispod select elementa
  statusSelect.parentElement.appendChild(newOrderFieldWrapper);

  // Funkcija za toggle prikaza forme
  const toggleFormVisibility = () => {
    if (form.style.display === "none" || form.style.display === "") {
      form.style.display = "block";
    } else {
      form.style.display = "none";
    }
  };

  // Dodaj event listener na dugme za upravljanje
  if (toggleButton) {
    toggleButton.addEventListener("click", (e) => {
      e.preventDefault(); // spreči default ponašanje
      toggleFormVisibility();
    });
  }

  // Dodaj event listener na select za status
  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      const selectedValue = e.target.value;
      if (selectedValue === "sent-exchange") {
        newOrderFieldWrapper.style.display = "block";
        newOrderInput.required = true;
      } else {
        newOrderFieldWrapper.style.display = "none";
        newOrderInput.required = false;
        newOrderInput.value = ""; // očisti vrednost, kako bi browser ne smatrao da je prazan required field
      }
    });
  }
});
