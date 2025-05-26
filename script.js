const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let skinSeleccionado = null;
let personaje, plataformas, pizzas = [];
let tiempo = 60, puntos = 0;
let juegoActivo = false;
let velocidad = 4;
let gravedad = 1;
let salto = -22;
let intervaloJuego;

const urlSheets = "https://script.google.com/macros/s/AKfycbxDj3qQq71M0E6S4G7Ulq0bWv4oUJODSWMpKxq_gs73CpXW4_5pFq7OFnzYukdLh8d4Kw/exec";
const hoy = new Date().toDateString();

if (localStorage.getItem("ottopizzaJugado") === hoy) {
  document.body.innerHTML = "<div class='pantalla'><h2>¡Ya jugaste hoy! 🍕</h2><p>Volvé mañana para seguir participando.</p></div>";
}

// Skins
document.querySelectorAll(".skins img").forEach(img => {
  img.addEventListener("click", () => {
    document.querySelectorAll(".skins img").forEach(i => i.classList.remove("seleccionado"));
    img.classList.add("seleccionado");
    skinSeleccionado = img.dataset.skin;
  });
});

document.getElementById("empezarBtn").addEventListener("click", () => {
  if (!skinSeleccionado) return alert("Seleccioná un personaje");
  iniciarJuego();
});

function iniciarJuego() {
  document.getElementById("inicio").classList.add("oculto");
  canvas.classList.remove("oculto");

  personaje = {
    x: 100,
    y: canvas.height - 150,
    vy: 0,
    ancho: 60,
    alto: 60,
    img: new Image()
  };
  personaje.img.src = `assets/${skinSeleccionado}`;

  plataformas = [{ x: 0, y: canvas.height - 100, w: 300 }];
  pizzas = [];
  puntos = 0;
  tiempo = 60;
  juegoActivo = true;

  intervaloJuego = setInterval(() => {
    tiempo--;
    if (tiempo <= 0) ganar();
  }, 1000);

  loop();
}

function loop() {
  if (!juegoActivo) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffe5b4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Plataformas
  plataformas.forEach(p => {
    p.x -= velocidad;
    ctx.fillStyle = "#d2691e";
    ctx.fillRect(p.x, p.y, p.w, 20);
  });

  // Generar nueva plataforma — distancia más corta
  const ultima = plataformas[plataformas.length - 1];
  if (ultima.x + ultima.w < canvas.width - 150) {
    const nuevaAltura = canvas.height - (100 + Math.random() * 150);
    const distanciaMin = 60;
    const distanciaMax = 120; // Reducción de la distancia máxima entre plataformas
    const distancia = distanciaMin + Math.random() * (distanciaMax - distanciaMin);

    plataformas.push({
      x: ultima.x + ultima.w + distancia,
      y: nuevaAltura,
      w: 120 + Math.random() * 50
    });
  }

  plataformas = plataformas.filter(p => p.x + p.w > 0);

  // Pizzas — se ubican sobre plataformas de forma más lógica
  if (Math.random() < 0.02) {
    const plataformaAleatoria = plataformas[Math.floor(Math.random() * plataformas.length)];
    const pizza = {
      x: plataformaAleatoria.x + plataformaAleatoria.w / 2 - 20, // Centrado en la plataforma
      y: plataformaAleatoria.y - 40, // Justo encima de la plataforma
      img: new Image()
    };
    pizza.img.src = "assets/pizza.png";
    pizzas.push(pizza);
  }

  pizzas.forEach(p => {
    p.x -= velocidad;
    ctx.drawImage(p.img, p.x, p.y, 40, 40);

    // Colisión pizza
    if (
      p.x < personaje.x + personaje.ancho &&
      p.x + 40 > personaje.x &&
      p.y < personaje.y + personaje.alto &&
      p.y + 40 > personaje.y
    ) {
      puntos++;
      pizzas = pizzas.filter(pi => pi !== p);
    }
  });

  // Física personaje
  personaje.vy += gravedad;
  personaje.y += personaje.vy;

  // Colisión con plataformas — CORRECCIÓN CLAVE (no pasar por encima de las plataformas)
  plataformas.forEach(p => {
    if (
      personaje.x + personaje.ancho > p.x &&
      personaje.x < p.x + p.w &&
      personaje.y + personaje.alto <= p.y + 20 && // Ajuste para evitar que pase por debajo
      personaje.y + personaje.alto + personaje.vy >= p.y &&
      personaje.vy >= 0
    ) {
      personaje.y = p.y - personaje.alto;
      personaje.vy = 0;
    }
  });

  // Dibujar personaje
  ctx.drawImage(personaje.img, personaje.x, personaje.y, personaje.ancho, personaje.alto);

  // Mostrar puntos y tiempo
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText(`Puntos: ${puntos}`, 20, 30);
  ctx.fillText(`Tiempo: ${tiempo}s`, 20, 60);

  // Caída
  if (personaje.y > canvas.height) perder();

  requestAnimationFrame(loop);
}

window.addEventListener("keydown", e => {
  if (e.code === "Space" && personaje.vy === 0) {
    personaje.vy = salto;
  }
});

function ganar() {
  juegoActivo = false;
  clearInterval(intervaloJuego);
  canvas.classList.add("oculto");
  document.getElementById("ganaste").classList.remove("oculto");
}

function perder() {
  juegoActivo = false;
  clearInterval(intervaloJuego);
  canvas.classList.add("oculto");
  document.getElementById("perdiste").classList.remove("oculto");
  localStorage.setItem("ottopizzaJugado", hoy); // BLOQUEAR POR PERDER
}

// Formulario
document.getElementById("formulario").addEventListener("submit", e => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(e.target).entries());

  fetch(urlSheets, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });

  localStorage.setItem("ottopizzaJugado", hoy);
  document.getElementById("ganaste").innerHTML = `
    <h2>¡Gracias por jugar! 🎉</h2>
    <p>Tu cupón del 15% fue enviado correctamente.</p>
  `;
});
