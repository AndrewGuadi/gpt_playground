// Mobile menu functionality
const menuBtn = document.getElementById('menu-btn');
const mobileNav = document.getElementById('mobile-nav');
menuBtn && menuBtn.addEventListener('click', () => {
  if (mobileNav.classList.contains('hidden')) {
    mobileNav.classList.remove('hidden');
    mobileNav.style.maxHeight = '800px';
  } else {
    mobileNav.classList.add('hidden');
    mobileNav.style.maxHeight = '0px';
  }
});
// Close mobile nav if clicking outside
window.addEventListener('click', e => {
  if (!mobileNav || !menuBtn) return;
  if (!mobileNav.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
    mobileNav.classList.add('hidden');
    mobileNav.style.maxHeight = '0px';
  }
});
// Review carousel
const carousel = document.getElementById('review-carousel');
const nextBtn = document.getElementById('nextReview');
const prevBtn = document.getElementById('prevReview');
let carouselScroll = 0;
let maxScroll = 0;
if (carousel && nextBtn && prevBtn) {
  const scrollAmount = 350; // px per card
  nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
  prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
}
// Newsletter signup form (fake submit for demo)
const form = document.getElementById('newsletterForm');
const successMsg = document.getElementById('newsletterSuccess');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.classList.add('opacity-50');
    form.querySelector('button').disabled = true;
    setTimeout(() => {
      if(successMsg){
        successMsg.classList.remove('hidden');
        form.classList.add('hidden');
      }
    }, 1000);
  });
}
// Smooth scrolling for anchor links (header nav)
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if(target){
      e.preventDefault();
      window.scrollTo({
        top: target.offsetTop - 60,
        behavior: 'smooth'
      });
    }
  });
});