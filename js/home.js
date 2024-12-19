
var menuBtn = document.querySelector('.menu-btn');
var nav = document.querySelector('nav');
var lineOne = document.querySelector('nav .menu-btn .line--1');
var lineTwo = document.querySelector('nav .menu-btn .line--2');
var lineThree = document.querySelector('nav .menu-btn .line--3');
var link = document.querySelector('nav .nav-links');
var content = document.querySelector('.content')

menuBtn.addEventListener('click', () => {
    nav.classList.toggle('nav-open');
    lineOne.classList.toggle('line-cross');
    lineTwo.classList.toggle('line-fade-out');
    lineThree.classList.toggle('line-cross');
    link.classList.toggle('fade-in');
    content.classList.toggle('content-open');
    
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

  function showContent(section){
    const contentDiv = document.getElementById('content');
    let contentHtml = '';

    switch (section){
      case 'digital':
        contentHtml=`
         <style>
    :root{
  --blue-light:#0080C9;
  --blue-dark: #003D7B;
  --white: white;
  --black: black;
}


.container {
    position: absolute;
    top: 25%;
    left: 10%;
    margin-left: 100px;
    height: 300px;
    width: 300px;
    border-radius: 10px;
    box-shadow: 4px 4px 30px rgba(0, 0, 0, .2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    gap: 5px;
    background-color: rgba(0, 110, 255, 0.041);
  }
  
  .header {
    flex: 1;
    width: 100%;
    border: 2px dashed var(--blue-light);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  
  .header svg {
    height: 100px;
  }
  
  .header p {
    text-align: center;
    color: black;
  }
  
  .footer {
    background-color: rgba(0, 110, 255, 0.075);
    width: 100%;
    height: 40px;
    padding: 8px;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: black;
    border: none;
  }
  
  .footer svg {
    height: 130%;
    fill: var(--blue-light);
    background-color: rgba(70, 66, 66, 0.103);
    border-radius: 50%;
    padding: 2px;
    cursor: pointer;
    box-shadow: 0 2px 30px rgba(0, 0, 0, 0.205);
  }
  
  .footer p {
    flex: 1;
    text-align: center;
  }
  
  #file {
    display: none;
  }
  </style>
          <div class="container"> 
  <div class="header"> 
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> 
      <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg> <p>Browse File to upload!</p>
  </div> 
  <label for="file" class="footer"> 
    <svg fill="#000000" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M15.331 6H8.5v20h15V14.154h-8.169z"></path><path d="M18.153 6h-.009v5.342H23.5v-.002z"></path></g></svg> 
    <p>Not selected file</p> 
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="#000000" stroke-width="2"></path> <path d="M19.5 5H4.5" stroke="#000000" stroke-width="2" stroke-linecap="round"></path> <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="#000000" stroke-width="2"></path> </g></svg>
  </label> 
  <input id="file" type="file"> 
</div>
`;
          break;
        case 'dependencia':
          contentHtml=`
          <style>
* {
    box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: "Lato";

}

:root {
    --blue-light:#0080C9;
    --blue-dark: #003D7B;
    --white: white;
    --black: black;
}
html{
        font-size: 62.5%;   
}

.form {
    position: absolute;
    top: 25%;
    left: 10%;
    margin-left: 100px;
    background-color: #15172b;
    border-radius: 20px;
    box-sizing: border-box;
    height: 400px;
    padding: 20px;
    width: 320px;
  }
  
 
  
  .subtitle {
    margin-top: 10px;
    color: #eee;
    font-family: sans-serif;
    font-size: 16px;
    font-weight: 600;
  }
  
  .subtitle_1 {
    color: #eee;
    font-family: sans-serif;
    font-size: 10px;
    font-weight: 600;
  }

  .input-container {
    height: 40px;
    position: relative;
    width: 100%;
  }
  
  .ic1 {
    margin-top: 20px;
  }
  
  .ic2 {
    margin-top: 30px;
  }
  
  .input {
    background-color: #303245;
    border-radius: 12px;
    border: 0;
    box-sizing: border-box;
    color: #eee;
    font-size: 18px;
    height: 40px;
    outline: 0;
    padding: 4px 10px 0;
    width: 100%;
  }
  
  .cut {
    background-color: #15172b;
    border-radius: 10px;
    height: 10px;
    left: 20px;
    position: absolute;
    top: -20px;
    transform: translateY(0);
    transition: transform 200ms;
    width: 76px;
  }
  
  .cut-short {
    width: 30px;
  }
  
  .input:focus ~ .cut,
  .input:not(:placeholder-shown) ~ .cut {
    transform: translateY(8px);
  }
  
  .placeholder {
    color: #65657b;
    font-family: sans-serif;
    left: 20px;
    line-height: 14px;
    pointer-events: none;
    position: absolute;
    transform-origin: 0 50%;
    transition: transform 200ms, color 200ms;
    top: 20px;
    font-size: 15px;
  }
  
  .input:focus ~ .placeholder,
  .input:not(:placeholder-shown) ~ .placeholder {
    transform: translateY(-30px) translateX(10px) scale(0.75);
  }
  
  .input:not(:placeholder-shown) ~ .placeholder {
    color: #808097;
  }
  
  .input:focus ~ .placeholder {
    color: var(--white);
    width: 50px;
  }
  
  .submit {
    background-color: #08d;
    border-radius: 12px;
    border: 0;
    box-sizing: border-box;
    color: #eee;
    cursor: pointer;
    font-size: 18px;
    height: 50px;
    margin-top: 38px;
    text-align: center;
    width: 100%;
  }
  
  .submit:active {
    background-color: #06b;
  }
  .checkbox-wrapper-51
  {
    margin-top: 10px;
  }
  
.checkbox-wrapper-51 input[type="checkbox"] {
    visibility: hidden;
    display: none;
  }
  
  .checkbox-wrapper-51 .toggle {
    position: relative;
    display: block;
    width: 42px;
    height: 24px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transform: translate3d(0, 0, 0);
  }
  
  .checkbox-wrapper-51 .toggle:before {
    content: "";
    position: relative;
    top: 1px;
    left: 1px;
    width: 40px;
    height: 22px;
    display: block;
    background: #c8ccd4;
    border-radius: 12px;
    transition: background 0.2s ease;
  }
  
  .checkbox-wrapper-51 .toggle span {
    position: absolute;
    top: 0;
    left: 0;
    width: 24px;
    height: 24px;
    display: block;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(154,153,153,0.75);
    transition: all 0.2s ease;
  }
  
  .checkbox-wrapper-51 .toggle span svg {
    margin: 7px;
    fill: none;
  }
  
  .checkbox-wrapper-51 .toggle span svg path {
    stroke: #c8ccd4;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 24;
    stroke-dashoffset: 0;
    transition: all 0.5s linear;
  }
  
  .checkbox-wrapper-51 input[type="checkbox"]:checked + .toggle:before {
    background: #1175c7;
  }
  
  .checkbox-wrapper-51 input[type="checkbox"]:checked + .toggle span {
    transform: translateX(18px);
  }
  
  .checkbox-wrapper-51 input[type="checkbox"]:checked + .toggle span path {
    stroke: #000000;
    stroke-dasharray: 25;
    stroke-dashoffset: 25;
  }
    </style>
          <div class="form">
        <div class="subtitle">Nro. identificador</div>
        <div class="input-container ic1">
        <input id="firstname" class="input" type="text" placeholder="">
        <div class="cut"></div>
        <label for="firstname" class="placeholder">Numero</label>
        </div>
        <div class="subtitle">Dependencia</div>
        <div class="input-container ic2">
        <input id="lastname" class="input" type="text" placeholder="">
        <div class="cut"></div>
        <label for="lastname" class="placeholder">Nombre</label>
        </div>
        

 <!--       <div class="input-container ic2">
            <input id="email" class="input" type="text" placeholder="">
                <div class="cut cut-short"></div>
                <label for="email" class="placeholder">Email
                </label>
        </div>-->
        <div class="subtitle_1">Activo</div>

        <div class="checkbox-wrapper-51">
            <input id="cbx-51" type="checkbox">
            <label class="toggle" for="cbx-51">
                <span>
                <svg viewBox="0 0 10 10" height="10px" width="10px">
                        <path d="M5,1 L5,1 C2.790861,1 1,2.790861 1,5 L1,5 C1,7.209139 2.790861,9 5,9 L5,9 C7.209139,9 9,7.209139 9,5 L9,5 C9,2.790861 7.209139,1 5,1 L5,9 L5,1 Z"></path>
                </svg>
                </span>
            </label>
            </div>
        <button type="text" class="submit">Guardar</button>

    </div>
`;
break;
    }
    contentDiv.innerHTML = contentHtml;

  }

 