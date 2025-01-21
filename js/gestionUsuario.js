document.getElementById("userForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Evitar que el formulario se recargue

    // Obtener los valores del formulario
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const role = document.getElementById("role").value;
    const status = document.querySelector('input[name="status"]:checked').value;

    // Crear una nueva fila en la tabla de usuarios
    const table = document.getElementById("userTable").getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    newRow.innerHTML = `
        <td>${name}</td>
        <td>${document}</td>
        <td>${email}</td>
        <td>${role}</td>
        <td>${status.charAt(0).toUpperCase() + status.slice(1)}</td>
    `;

    // Limpiar el formulario
    document.getElementById("userForm").reset();
});