document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form button.btn-danger[type="submit"]').forEach(button => {
    button.addEventListener('click', (e) => {
      const confirmed = confirm("Da li ste sigurni da želite da izbrišete ovu stavku?");
      if (!confirmed) {
        e.preventDefault();
      }
    });
  });
});
