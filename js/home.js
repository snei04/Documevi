
var menuBtn = document.querySelector('.menu-btn');
var nav = document.querySelector('nav');
var lineOne = document.querySelector('nav .menu-btn .line--1');
var lineTwo = document.querySelector('nav .menu-btn .line--2');
var lineThree = document.querySelector('nav .menu-btn .line--3');
var link = document.querySelector('nav .nav-links');
menuBtn.addEventListener('click', () => {
    nav.classList.toggle('nav-open');
    lineOne.classList.toggle('line-cross');
    lineTwo.classList.toggle('line-fade-out');
    lineThree.classList.toggle('line-cross');
    link.classList.toggle('fade-in');
})




// Seleccionamos todos los elementos con la clase 'Dropdown'
const dropdowns = document.querySelectorAll('.Dropdown');

// Añadimos un evento de click a cada uno de los elementos seleccionados
dropdowns.forEach(function(dropdown) {
  dropdown.addEventListener('click', function() {
    // Alternamos la clase 'is-expanded' en el elemento que fue clickeado
    this.classList.toggle('is-expanded');
  });
});




  
  function toggleMenu(event, submenuId) {
    event.preventDefault(); // Evita que el enlace redireccione
    const submenu = document.getElementById(submenuId);
    
    // Verifica si el submenú está visible y lo alterna
    if (submenu.style.display === "block") {
      submenu.style.display = "none";
    } else {
      submenu.style.display = "block";
    }
  }