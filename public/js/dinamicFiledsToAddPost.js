document.addEventListener('DOMContentLoaded', () => {
    // Lista svih dostupnih kategorija
    const availableCategories = [
        "Informacije","Novo","Proleće","Leto",
        "Jesen","Zima","Istaknuto","Moda",
        "Saveti","Partnerstvo","Sport i Fitness","Casual Stil",
        "Elegantno i Poslovno","Trendovi","Sezonske Akcije",
        "Recenzije Proizvoda","DIY i Modifikacije","Ekologija i Moda"
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
        removeButton.classList.add('btn-danger', 'removeField');
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
    };

    // Event listener za dugme "Dodaj kategoriju"
    addCategoryButton.addEventListener('click', addCategoryField);

    // Inicijalno ažuriranje opcija u postojećim poljima
    updateSelectedCategories();
    updateCategoryOptions();


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
        removeButton.classList.add('btn-danger', 'removeField');
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
        removeButton.classList.add('btn-danger', 'removeField');
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

    const contentContainer = document.getElementById('contentContainer');
    const addContentButton = document.getElementById('addContent');

    const addContentField = () => {
        const index = contentContainer.querySelectorAll('.dynamic-group').length;
        const group = document.createElement('div');
        group.classList.add('dynamic-group');

        const textarea = document.createElement('textarea');
        textarea.id = `content${index}`;
        textarea.name = 'content[]';
        textarea.rows = 5;
        textarea.classList.add('main-form__textarea');
        textarea.classList.add('width-100');
        textarea.required = true;

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('btn-danger', 'removeField');
        removeButton.textContent = 'Izbriši';

        group.appendChild(textarea);
        group.appendChild(removeButton);
        contentContainer.appendChild(group);

        removeButton.addEventListener('click', () => {
            group.remove();
        });
    };

    addContentButton.addEventListener('click', addContentField);

    // Aktiviramo event listenere za brisanje postojećih polja
    const existingContentFields = contentContainer.querySelectorAll('.dynamic-group .removeField');
    existingContentFields.forEach(button => {
        button.addEventListener('click', (event) => {
            const group = event.target.closest('.dynamic-group');
            if (group) group.remove();
        });
    });
});