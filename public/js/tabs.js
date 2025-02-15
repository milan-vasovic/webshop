document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Uklanjanje klase 'active' sa svih dugmadi i tabova
            buttons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Dodavanje klase 'active' na kliknuto dugme
            button.classList.add('active');

            // Pronalaženje odgovarajućeg tab sadržaja i dodavanje klase 'active'
            const targetTab = button.getAttribute('data-tab');
            const correspondingContent = document.querySelector(`.tab-content[data-tab="${targetTab}"]`);
            if (correspondingContent) {
                correspondingContent.classList.add('active');
            }
        });
    });
});