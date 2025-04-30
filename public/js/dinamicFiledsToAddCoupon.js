document.addEventListener('DOMContentLoaded', () => {
    const availableStatuses = ["active", "inactive", "single-use", "multiple-use", "time-sensitive", "amount-sensitive"]

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
        if (selectedStatuses.length >= availableStatuses.length-1) {
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

    // Dodavanje event listener-a na već postojeće dugmiće "Izbriši"
    const existingRemoveButtons = statusesContainer.querySelectorAll('.removeField');
    existingRemoveButtons.forEach((removeButton) => {
        removeButton.addEventListener('click', (e) => {
            const group = removeButton.closest('.dynamic-group');
            const select = group.querySelector('select');
            if (select && select.value) {
                const index = selectedStatuses.indexOf(select.value);
                if (index !== -1) {
                    selectedStatuses.splice(index, 1);
                }
            }
            group.remove();
            updateSelectedStatuses();
            updateStatusOptions();
    });
});


});