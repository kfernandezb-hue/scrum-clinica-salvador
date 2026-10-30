/* ==========================================================
   LÓGICA – Scrum y Kanban, Clínica Salvador
   ========================================================== */

/* ---------------------------------------------------------
   1. MENÚ DE PESTAÑAS
   --------------------------------------------------------- */
var pestanas = [
  ["roles", "Roles"],
  ["backlog", "Backlog"],
  ["sprint", "Sprint"],
  ["kanban", "Kanban"],
  ["daily", "Daily"],
  ["mockup", "Mockup"],
  ["review", "Review y Retro"],
  ["mant", "Mantenimiento"]
];

var menu = document.getElementById("menu");

// Muestra la sección elegida y marca su botón como activo
function mostrarSeccion(id) {
  pestanas.forEach(function (p) {
    document.getElementById(p[0]).classList.toggle("activa", p[0] === id);
  });
  Array.prototype.forEach.call(menu.children, function (boton) {
    boton.classList.toggle("activo", boton.dataset.id === id);
  });
}

// Crea un botón por cada pestaña
pestanas.forEach(function (p) {
  var boton = document.createElement("button");
  boton.textContent = p[1];
  boton.dataset.id = p[0];
  boton.onclick = function () { mostrarSeccion(p[0]); };
  menu.appendChild(boton);
});

mostrarSeccion("roles"); // sección inicial


/* ---------------------------------------------------------
   2. PRODUCT BACKLOG (historias de usuario)
   Formato: [ID, historia, prioridad, puntos]
   --------------------------------------------------------- */
var historias = [
  ["HU-01", "registrar un paciente nuevo", "Alta", 3],
  ["HU-02", "buscar un paciente por documento", "Alta", 2],
  ["HU-03", "ver los médicos disponibles por especialidad", "Alta", 5],
  ["HU-04", "ver los horarios libres de un médico", "Alta", 5],
  ["HU-05", "registrar una nueva cita (paciente + médico + horario)", "Alta", 8],
  ["HU-06", "recibir confirmación al guardar la cita", "Media", 2],
  ["HU-07", "cancelar o reprogramar una cita", "Media", 5],
  ["HU-08", "enviar recordatorio de cita al paciente", "Baja", 5]
];

// Dibuja una fila de la tabla por cada historia
document.getElementById("tabla-backlog").innerHTML = historias
  .map(function (h) {
    return "<tr><td>" + h.join("</td><td>") + "</td></tr>";
  })
  .join("");


/* ---------------------------------------------------------
   3. TABLERO KANBAN
   Cada tarea es [nombre, índice de columna]
   --------------------------------------------------------- */
var columnas = ["Por hacer", "En progreso", "En pruebas", "Hecho"];
var LIMITE_WIP = 3; // máximo de tareas en "En progreso"

var tareas = [
  ["Mensaje de confirmación", 0],
  ["Pruebas HU-05", 0],
  ["Formulario de cita", 1],
  ["Regla anti-cruce", 1],
  ["Lista de médicos", 2],
  ["Registro de paciente", 3],
  ["Búsqueda por documento", 3]
];

// Cuenta cuántas tareas hay en una columna
function contarEnColumna(indice) {
  return tareas.filter(function (t) { return t[1] === indice; }).length;
}

// Dibuja todo el tablero
function dibujarTablero() {
  var html = "";

  columnas.forEach(function (nombre, i) {
    html += '<div class="columna"><h3>' + nombre + " (" + contarEnColumna(i) + ")</h3>";

    tareas.forEach(function (t, j) {
      if (t[1] !== i) return; // solo las tareas de esta columna
      html += '<div class="tarea">' + t[0] + "<div>";
      if (i > 0) html += '<button data-j="' + j + '" data-d="-1">◀</button>'; // mover a la izquierda
      if (i < 3) html += '<button data-j="' + j + '" data-d="1">▶</button>';  // mover a la derecha
      html += "</div></div>";
    });

    html += "</div>";
  });

  document.getElementById("tablero").innerHTML = html;

  // Aviso si se supera el límite WIP
  document.getElementById("aviso-wip").innerHTML =
    contarEnColumna(1) > LIMITE_WIP
      ? '<div class="mensaje error">Se superó el límite WIP de ' + LIMITE_WIP + ' en “En progreso”.</div>'
      : "";
}

// Un solo "click" para todos los botones de flecha
document.getElementById("tablero").onclick = function (e) {
  var boton = e.target.closest("button");
  if (!boton) return;
  tareas[Number(boton.dataset.j)][1] += Number(boton.dataset.d); // mueve la tarea
  dibujarTablero();
};

dibujarTablero();


/* ---------------------------------------------------------
   4. MOCKUP: REGISTRAR CITA
   --------------------------------------------------------- */
// Médicos por especialidad
var medicosPorEspecialidad = {
  "Medicina general": ["Dr. Gómez", "Dra. Pérez"],
  "Pediatría": ["Dra. Torres"],
  "Odontología": ["Dr. Ruiz"]
};

// Horarios disponibles en el día
var horasDelDia = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"];

var citas = [];          // citas ya registradas: { medico, fecha, hora }
var horaElegida = "";    // horario que el recepcionista seleccionó

var selEspecialidad = document.getElementById("especialidad");
var selMedico = document.getElementById("medico");
var inpFecha = document.getElementById("fecha");
var resultado = document.getElementById("resultado");

// Llena la lista de especialidades
Object.keys(medicosPorEspecialidad).forEach(function (esp) {
  selEspecialidad.add(new Option(esp, esp));
});

// Fecha por defecto: dentro de 3 días
var hoy = new Date();
hoy.setDate(hoy.getDate() + 3);
inpFecha.value = hoy.toISOString().slice(0, 10);

// Cita de ejemplo ya ocupada (para mostrar la regla anti-cruce)
citas.push({ medico: "Dr. Gómez", fecha: inpFecha.value, hora: "10:00" });

// Revisa si un médico ya tiene cita en esa fecha y hora
function estaOcupado(medico, fecha, hora) {
  return citas.some(function (c) {
    return c.medico === medico && c.fecha === fecha && c.hora === hora;
  });
}

// Llena la lista de médicos según la especialidad elegida
function cargarMedicos() {
  selMedico.innerHTML = "";
  medicosPorEspecialidad[selEspecialidad.value].forEach(function (m) {
    selMedico.add(new Option(m, m));
  });
  dibujarHorarios();
}

// Dibuja los botones de horario (los ocupados quedan deshabilitados)
function dibujarHorarios() {
  horaElegida = "";
  document.getElementById("horarios").innerHTML = horasDelDia
    .map(function (h) {
      var ocupado = estaOcupado(selMedico.value, inpFecha.value, h);
      return '<button class="horario" data-h="' + h + '"' + (ocupado ? " disabled" : "") + ">" + h + "</button>";
    })
    .join("");
}

// Al cambiar especialidad, médico o fecha, se recalculan los horarios
selEspecialidad.onchange = cargarMedicos;
selMedico.onchange = dibujarHorarios;
inpFecha.onchange = dibujarHorarios;
cargarMedicos();

// Elegir un horario libre
document.getElementById("horarios").onclick = function (e) {
  var boton = e.target.closest(".horario");
  if (!boton || boton.disabled) return;
  horaElegida = boton.dataset.h;
  Array.prototype.forEach.call(this.children, function (b) {
    b.classList.toggle("elegido", b === boton);
  });
};

// Botón "Registrar cita"
document.getElementById("btn-registrar").onclick = function () {
  var documento = document.getElementById("documento").value.trim();

  // Validación: campos obligatorios
  if (!documento || !inpFecha.value || !horaElegida) {
    resultado.innerHTML = '<div class="mensaje error">Todos los campos son obligatorios: documento, médico, fecha y horario.</div>';
    return;
  }

  // Regla anti-cruce: el médico no puede tener dos citas a la misma hora
  if (estaOcupado(selMedico.value, inpFecha.value, horaElegida)) {
    resultado.innerHTML = '<div class="mensaje error">El médico ya tiene una cita en ese horario.</div>';
    return;
  }

  // Guardar la cita
  citas.push({ medico: selMedico.value, fecha: inpFecha.value, hora: horaElegida });

  // Agregarla a la lista visible
  var lista = document.getElementById("lista-citas");
  if (lista.children[0].classList.contains("texto-suave")) lista.innerHTML = ""; // quita "Aún no hay citas"
  var item = document.createElement("li");
  item.textContent = documento + " · " + selMedico.value + " · " + inpFecha.value + " · " + horaElegida;
  lista.appendChild(item);

  // Mensaje de confirmación
  resultado.innerHTML =
    '<div class="mensaje ok">Cita registrada: paciente ' + documento + ", " +
    selMedico.value + ", " + inpFecha.value + " a las " + horaElegida + ".</div>";

  dibujarHorarios(); // el horario recién usado queda bloqueado
};


/* ---------------------------------------------------------
   5. MANTENIMIENTO DE SOFTWARE
   --------------------------------------------------------- */
var explicaciones = {
  c: "Correctivo: se corrige el error de citas fuera del horario de atención.",
  a: "Adaptativo: no aplica en este caso (no cambió el entorno ni una norma).",
  p: "Perfectivo: se mejora la confirmación mostrando el consultorio.",
  v: "Preventivo: opcional, si se refactoriza la validación de horarios para evitar fallos futuros."
};

var casillas = document.querySelectorAll(".tipo-mant");

// Cada vez que se marca o desmarca una casilla, se actualiza la explicación
Array.prototype.forEach.call(casillas, function (casilla) {
  casilla.onchange = function () {
    var texto = [];
    Array.prototype.forEach.call(casillas, function (c) {
      if (c.checked) texto.push("<p>" + explicaciones[c.value] + "</p>");
    });
    document.getElementById("explicacion-mant").innerHTML = texto.join("");
  };
});


/* ---------------------------------------------------------
   6. BOTÓN DE TEMA (claro / oscuro)
   --------------------------------------------------------- */
document.getElementById("btn-tema").onclick = function () {
  var raiz = document.documentElement;
  var esOscuro = raiz.dataset.theme
    ? raiz.dataset.theme === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  raiz.dataset.theme = esOscuro ? "light" : "dark";
};