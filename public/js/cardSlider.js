document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.circular-badges-container');
    const badges = Array.from(container.querySelectorAll('.circular-badge'));
  
    const containerWidth = container.offsetWidth;
    const badgeWidth = badges[0].offsetWidth;
    const badgeCount = badges.length;
  
    const isMobile = window.innerWidth < 768;
    const gap = isMobile ? 20 : (containerWidth - (badgeCount * badgeWidth)) / badgeCount;
    const speed = 0.5; // px po frame-u
  
    let positions = [];
    let currentLeft = 0;
  
    if (isMobile) {
      // === Za mobilne uređaje - posebna početna logika ===
      // Postavljamo prva 3 bedža izvan levog ekrana
      for (let i = 0; i < badgeCount; i++) {
        if (i < badgeCount - 2) {
          currentLeft = (i - (badgeCount - 2)) * (badgeWidth + gap); 
        } else {
          currentLeft = (i - (badgeCount - 4)) * (badgeWidth + gap); 
        }
        badges[i].style.transform = `translateX(${currentLeft}px)`;
        badges[i].style.transition = 'transform 0.3s linear';
        positions[i] = currentLeft;
      }
    } else {
      // === Desktop ponašanje kao do sada ===
      badges.forEach(badge => {
        badge.style.transform = `translateX(${currentLeft}px)`;
        badge.style.transition = 'transform 0.3s linear';
        positions.push(currentLeft);
        currentLeft += badge.offsetWidth + gap;
      });
    }
  
    function animateBadges() {
      badges.forEach((badge, index) => {
        positions[index] += speed;
        badge.style.transform = `translateX(${positions[index]}px)`;
  
        if (positions[index] > containerWidth) {
          badge.style.transition = 'none';
  
          if (isMobile) {
            // === Kada izađe na mobu, ide iza trenutno najdaljeg bedža levo ===
            const minPosition = Math.min(...positions);
            positions[index] = minPosition - badgeWidth - gap;
          } else {
            // === Desktop - vraćamo ga nazad sa leve strane
            positions[index] = 0 - badgeWidth;
          }
  
          badge.style.transform = `translateX(${positions[index]}px)`;
  
          requestAnimationFrame(() => {
            badge.style.transition = 'transform linear';
          });
        }
      });
  
      requestAnimationFrame(animateBadges);
    }
  
    animateBadges();
  });
  