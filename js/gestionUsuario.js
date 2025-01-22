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


document.getElementById("userForm").addEventListener("submit", function(event) {
    const phone = document.getElementById("phone").value;

    if (!/^\d{10}$/.test(phone)) {
        alert("El campo de teléfono debe contener exactamente 10 dígitos.");
        event.preventDefault(); // Evitar el envío del formulario
    }
});

document.getElementById("phone").addEventListener("input", function (event) {
    const input = event.target;
    const value = input.value;

    // Eliminar cualquier carácter no numérico
    input.value = value.replace(/\D/g, "");

    // Limitar a 10 dígitos
    if (input.value.length > 10) {
        input.value = input.value.slice(0, 10);
    }
});