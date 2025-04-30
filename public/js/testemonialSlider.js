document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.testimonial-track');
  const cards = Array.from(container.querySelectorAll('.card__container--testimonial'));

  const speed = 0.5;
  const gap = parseFloat(getComputedStyle(container).gap) || 20;

  container.style.position = 'relative';
  let positions = [];

  // Inicijalna postavka
  let currentLeft = 0;
  cards.forEach((card, i) => {
    card.style.position = 'absolute';
    card.style.left = `${currentLeft}px`;
    positions[i] = currentLeft;
    currentLeft += card.offsetWidth + gap;
  });

  function animate() {
    for (let i = 0; i < cards.length; i++) {
      positions[i] -= speed;
      cards[i].style.left = `${positions[i]}px`;
    }

    for (let i = 0; i < cards.length; i++) {
      if (positions[i] + cards[i].offsetWidth < 0) {
        // Pronađi krajnju desnu poziciju
        let maxRight = 0;
        for (let j = 0; j < positions.length; j++) {
          if (j !== i) {
            const rightEdge = positions[j] + cards[j].offsetWidth;
            if (rightEdge > maxRight) maxRight = rightEdge;
          }
        }

        // Postavi karticu tačno iza najdesnije
        positions[i] = maxRight + gap;
        cards[i].style.left = `${positions[i]}px`;
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
});
