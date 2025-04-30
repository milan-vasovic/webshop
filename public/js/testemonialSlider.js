document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.testimonial-track');
  const cards = Array.from(container.querySelectorAll('.card__container--testimonial'));

  const containerWidth = container.offsetWidth;
  const cardWidth = cards[0].offsetWidth;
  const cardCount = cards.length;

  // Dinamički gap
  const totalCardWidth = cardWidth * cardCount;
  const availableSpace = containerWidth - totalCardWidth;
  const gap = cardCount > 0 ? availableSpace / (cardCount - 1) : 20;

  const speed = 1; // px po frame-u

  let positions = [];
  let currentLeft = 0 + gap;
  console.log(`Current left: ${currentLeft}`);
  console.log(`Container width: ${containerWidth}\n`);

  // Inicijalno rasporedi
  cards.forEach(card => {
    card.style.transform = `translateX(${currentLeft}px)`;
    card.style.transition = 'transform 0.3s linear';
    positions.push(currentLeft);
    console.log(`Card position: ${currentLeft}`);
    console.log(`Positions: ${positions}`);
    currentLeft += cardWidth + gap;
  });

  function animateCards() {
    // Prvo pomeraj sve kartice
    for (let i = 0; i < cards.length; i++) {
      positions[i] -= speed;
      cards[i].style.transform = `translateX(${positions[i]}px)`;
    }

    // Sada proveri samo NAJLEVLJU
    const minPosition = Math.min(...positions);
    console.log(`Min position: ${minPosition}`);
    const minIndex = positions.indexOf(minPosition);
    console.log(`Min index: ${minIndex}`);

    if (positions[minIndex] + cardWidth < 0) {
      // === Samo nju premestamo iza ===
      cards[minIndex].style.transition = 'none';
      
      positions[minIndex] = containerWidth + cardWidth + gap*2;
      cards[minIndex].style.transform = `translateX(${positions[minIndex]}px)`;

      requestAnimationFrame(() => {
        cards[minIndex].style.transition = 'transform 0.3s linear';
      });
    }

    requestAnimationFrame(animateCards);
  }

  animateCards();
});
