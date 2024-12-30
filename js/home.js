
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
    .container {
        position: relative;
        top: 400px;
        left: -100px;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
    }
    button {
        padding: 10px 20px;
        margin: 10px;
        font-size: 1.5rem;
        cursor: pointer;
        border: 2px solid #0080C9;
        color: white;
        border-radius: 50px;
        background-color: #0080C9;
    }
    button:hover {
        background-color: #003D7B;
    }
    button:active {
        background-color: black;
    }
    button:focus {
        outline: none;
    }
</style>
<body>
    <div class="container">
        <button>RADICACIÓN ESTANDAR</button>
        <button>RADICACIÓN MASIVO</button>
        <button>RADICACION POR CORREO</button>
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

 