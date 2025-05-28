document.addEventListener('DOMContentLoaded', () => {
  const availableStatuses = [
    "active", "inactive", "single-use",
    "multiple-use", "time-sensitive", "amount-sensitive"
  ];

  const selectedStatuses = [];

  const statusesContainer = document.getElementById('statusContainer');
  const addStatusButton = document.getElementById('addStatus');

  const updateSelectedStatuses = () => {
    selectedStatuses.length = 0;
    statusesContainer.querySelectorAll('select').forEach(select => {
      if (select.value) selectedStatuses.push(select.value);
    });
  };

  const updateStatusOptions = () => {
    statusesContainer.querySelectorAll('select').forEach(select => {
      const currentValue = select.value;
      select.innerHTML = '';

      availableStatuses.forEach(status => {
        if (!selectedStatuses.includes(status) || status === currentValue) {
          const option = document.createElement('option');
          option.value = status;
          option.textContent = status;
          if (status === currentValue) option.selected = true;
          select.appendChild(option);
        }
      });
    });
  };

  const createStatusField = () => {
    if (selectedStatuses.length >= availableStatuses.length - 1) {
      alert('Ne možete dodati više statusa. Dostigli ste maksimalan broj!');
      return;
    }

    const index = statusesContainer.querySelectorAll('.form__group.dynamic-group').length;

    const group = document.createElement('div');
    group.classList.add('form__group', 'dynamic-group');

    const select = document.createElement('select');
    select.id = `status${index}`;
    select.name = 'status[]';
    select.classList.add('form__select');
    select.required = true;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.classList.add('button', 'button--danger', 'button--sm', 'removeField');
    removeButton.textContent = 'Izbriši';

    group.appendChild(select);
    group.appendChild(removeButton);
    statusesContainer.appendChild(group);

    updateSelectedStatuses();
    updateStatusOptions();

    select.addEventListener('change', () => {
      updateSelectedStatuses();
      updateStatusOptions();
    });

    removeButton.addEventListener('click', () => {
      const idx = selectedStatuses.indexOf(select.value);
      if (idx !== -1) selectedStatuses.splice(idx, 1);
      group.remove();
      updateSelectedStatuses();
      updateStatusOptions();
    });
  };

  addStatusButton.addEventListener('click', createStatusField);

  updateSelectedStatuses();
  updateStatusOptions();

  // Eventi za već postojeće dugmiće "Izbriši"
  statusesContainer.querySelectorAll('.removeField').forEach(removeButton => {
    removeButton.addEventListener('click', () => {
      const group = removeButton.closest('.dynamic-group');
      const select = group.querySelector('select');
      if (select) {
        const idx = selectedStatuses.indexOf(select.value);
        if (idx !== -1) selectedStatuses.splice(idx, 1);
      }
      group.remove();
      updateSelectedStatuses();
      updateStatusOptions();
    });
  });
});
