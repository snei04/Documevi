// Seleccionamos todos los elementos con la clase 'Dropdown'
const dropdowns = document.querySelectorAll('.Dropdown');

// Añadimos un evento de click a cada uno de los elementos seleccionados
dropdowns.forEach(function(dropdown) {
  dropdown.addEventListener('click', function() {
    // Alternamos la clase 'is-expanded' en el elemento que fue clickeado
    this.classList.toggle('is-expanded');
  });
});