document.addEventListener('DOMContentLoaded', () => {
  const availableCategories = [
    "Informacije", "Novo", "Proleće", "Leto",
    "Jesen", "Zima", "Istaknuto", "Moda",
    "Saveti", "Partnerstvo", "Sport i Fitness", "Casual Stil",
    "Elegantno i Poslovno", "Trendovi", "Sezonske Akcije",
    "Recenzije Proizvoda", "DIY i Modifikacije", "Ekologija i Moda"
  ];

  const selectedCategories = [];

  const categoriesContainer = document.getElementById('categoriesContainer');
  const addCategoryButton = document.getElementById('addCategory');
  const tagsContainer = document.getElementById('tagsContainer');
  const addTagButton = document.getElementById('addTag');
  const keyWordsContainer = document.getElementById('keyWordsContainer');
  const addKeyWordButton = document.getElementById('addKeyWord');
  const contentContainer = document.getElementById('contentContainer');
  const addContentButton = document.getElementById('addContent');

  const updateSelectedCategories = () => {
    selectedCategories.length = 0;
    const selects = categoriesContainer.querySelectorAll('select');
    selects.forEach(select => {
      if (select.value) selectedCategories.push(select.value);
    });
  };

  const updateCategoryOptions = () => {
    const selects = categoriesContainer.querySelectorAll('select');
    selects.forEach(select => {
      const currentValue = select.value;
      select.innerHTML = '';
      availableCategories.forEach(category => {
        if (!selectedCategories.includes(category) || category === currentValue) {
          const option = document.createElement('option');
          option.value = category;
          option.textContent = category;
          if (category === currentValue) option.selected = true;
          select.appendChild(option);
        }
      });
    });
  };

  const handleRemove = (e) => {
    const group = e.target.closest('.dynamic-group');
    if (!group) return;

    const select = group.querySelector('select');
    if (select && select.value) {
      const idx = selectedCategories.indexOf(select.value);
      if (idx !== -1) selectedCategories.splice(idx, 1);
    }

    group.remove();
    updateSelectedCategories();
    updateCategoryOptions();
  };

  const createRemoveButton = () => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button--danger removeField';
    button.textContent = 'Izbriši';
    button.addEventListener('click', handleRemove);
    return button;
  };

  const attachRemoveListenersToExisting = () => {
    document.querySelectorAll('.dynamic-group .removeField').forEach(button => {
      button.removeEventListener('click', handleRemove);
      button.addEventListener('click', handleRemove);
    });
  };

  const addCategoryField = () => {
    if (selectedCategories.length >= availableCategories.length - 1) {
      alert('Ne možete dodati više kategorija. Dostigli ste maksimalan broj!');
      return;
    }

    const index = categoriesContainer.querySelectorAll('.dynamic-group').length;
    const group = document.createElement('div');
    group.className = 'form__group dynamic-group d-flex gap-2';

    const select = document.createElement('select');
    select.id = `categories${index}`;
    select.name = 'categories[]';
    select.className = 'form__select';
    select.required = true;

    group.appendChild(select);
    group.appendChild(createRemoveButton());
    categoriesContainer.appendChild(group);

    updateSelectedCategories();
    updateCategoryOptions();

    select.addEventListener('change', () => {
      updateSelectedCategories();
      updateCategoryOptions();
    });
  };

  const addTagField = () => {
    const index = tagsContainer.querySelectorAll('.dynamic-group').length;
    const group = document.createElement('div');
    group.className = 'form__group dynamic-group d-flex gap-2';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `tags${index}`;
    input.name = 'tags[]';
    input.className = 'form__input';
    input.required = true;

    group.appendChild(input);
    group.appendChild(createRemoveButton());
    tagsContainer.appendChild(group);
  };

  const addKeyWordField = () => {
    const index = keyWordsContainer.querySelectorAll('.dynamic-group').length;
    const group = document.createElement('div');
    group.className = 'form__group dynamic-group d-flex gap-2';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `keyWords${index}`;
    input.name = 'keyWords[]';
    input.className = 'form__input';
    input.required = true;

    group.appendChild(input);
    group.appendChild(createRemoveButton());
    keyWordsContainer.appendChild(group);
  };

  const addContentField = () => {
    const index = contentContainer.querySelectorAll('.dynamic-group').length;
    const group = document.createElement('div');
    group.className = 'form__group dynamic-group d-flex gap-2';

    const textarea = document.createElement('textarea');
    textarea.id = `content${index}`;
    textarea.name = 'content[]';
    textarea.rows = 5;
    textarea.className = 'form__textarea w-full';
    textarea.required = true;

    group.appendChild(textarea);
    group.appendChild(createRemoveButton());
    contentContainer.appendChild(group);
  };

  // Event bindings
  addCategoryButton.addEventListener('click', addCategoryField);
  addTagButton.addEventListener('click', addTagField);
  addKeyWordButton.addEventListener('click', addKeyWordField);
  addContentButton.addEventListener('click', addContentField);

  // Init
  updateSelectedCategories();
  updateCategoryOptions();
  attachRemoveListenersToExisting();
});
