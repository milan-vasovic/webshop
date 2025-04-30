const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');

function closeMobileMenu() {
  backdrop.classList.remove('active');
  sideDrawer.classList.remove('open');
  document.body.classList.remove('no-scroll');
}

function openMobileMenu() {
  backdrop.classList.add('active');
  sideDrawer.classList.add('open');
  document.body.classList.add('no-scroll');
}

backdrop.addEventListener('click', closeMobileMenu);
menuToggle.addEventListener('click', openMobileMenu);
