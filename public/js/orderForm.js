document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleBtn");
  const form = document.getElementById("statusForm");
  const statusSelect = document.getElementById("statusSelect");

  // Osiguraj da forma počne kao sakrivena
  form?.classList.add("d-none");

  // Dinamičko polje za "sent-exchange"
  const newOrderWrapper = document.createElement("div");
  newOrderWrapper.classList.add("form__group");
  newOrderWrapper.classList.add("d-none");

  const newOrderLabel = document.createElement("label");
  newOrderLabel.classList.add("form__label");
  newOrderLabel.setAttribute("for", "newOrderId");
  newOrderLabel.textContent = "Novi ID porudžbine:";

  const newOrderInput = document.createElement("input");
  newOrderInput.classList.add("form__input");
  newOrderInput.type = "text";
  newOrderInput.id = "newOrderId";
  newOrderInput.name = "newOrderId";
  newOrderInput.required = false;

  newOrderWrapper.appendChild(newOrderLabel);
  newOrderWrapper.appendChild(newOrderInput);

  // Ubaci novo polje ispod select-a
  statusSelect?.parentElement?.insertAdjacentElement("afterend", newOrderWrapper);

  // Toggle forma
  toggleButton?.addEventListener("click", (e) => {
    e.preventDefault();
    form?.classList.toggle("d-none");
  });

  // Prikaz/skrivanje dodatnog polja za novi ID
  statusSelect?.addEventListener("change", (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === "sent-exchange") {
      newOrderWrapper.classList.remove("d-none");
      newOrderInput.required = true;
    } else {
      newOrderWrapper.classList.add("d-none");
      newOrderInput.required = false;
      newOrderInput.value = "";
    }
  });
});
