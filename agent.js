const CONFIG_NEGOCIO = {
    nombre: "Sala de Belleza Lily",
    whatsappReal: "573202172979",
    direccion: "Calle 6 # 8B-39, Villamaría, Caldas, segundo piso",
    googleMaps: "https://share.google/t77CV6yMgpm94PB9f"
};

let estadoAgendamiento = {
    activo: false,
    paso: 0,
    datos: {
        nombre: "",
        telefono: "",
        servicio: "",
        fechaHora: ""
    }
};

function verificarHorarioAtencion() {
    const ahora = new Date();
    const dia = ahora.getDay();
    const hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    const horaDecimal = hora + (minutos / 60);

    if (dia >= 1 && dia <= 5) {
        return horaDecimal >= 8.0 && horaDecimal < 18.0;
    }
    if (dia === 6) {
        return horaDecimal >= 7.0 && horaDecimal < 19.0;
    }
    return false;
}

window.onload = function() {
    const badge = document.getElementById("status-badge");
    const abierto = verificarHorarioAtencion();

    if (abierto) {
        badge.textContent = "🟢 Abierto ahora";
        badge.classList.remove("status-closed");
    } else {
        badge.textContent = "🟠 Fuera de horario (Solo mensajes)";
        badge.classList.add("status-closed");
    }

    iniciarSaludo();
};

function iniciarSaludo() {
    const abierto = verificarHorarioAtencion();
    let saludo = `¡Hola! Bienvenida/o a **${CONFIG_NEGOCIO.nombre}** 🌸✨<br><br>`;

    if (!abierto) {
        saludo += `⚠️ *Nota:* En este momento nos encontramos **fuera de nuestro horario habitual**, pero puedo dejarte información o registrar tu solicitud para responderte a primera hora.<br><br>`;
    }

    saludo += `¿En qué te puedo ayudar hoy? Puedes seleccionar una opción abajo o escribirme directamente.`;
    agregarMensajeBot(saludo);
}

function toggleChat() {
    const widget = document.getElementById("chat-widget");
    widget.classList.toggle("hidden");
}

/* ============================================================
   NUEVO: abrir el chat desde los botones "Ver más"
   ============================================================ */

// Abre el chat (nunca lo cierra)
function abrirChat() {
    document.getElementById("chat-widget").classList.remove("hidden");
    const chatBody = document.getElementById("chat-body");
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Abre el chat y muestra el servicio de la tarjeta
function abrirChatConServicio(servicio, seccion, descripcion) {
    abrirChat();

    const nombreCompleto = seccion ? `${servicio} (${seccion})` : servicio;
    const nombreSeguro = nombreCompleto.replace(/'/g, "\\'");

    agregarMensajeBot(
        `✨ **${servicio}**${seccion ? " — " + seccion : ""}<br><br>` +
        `${descripcion}<br><br>` +
        `¿Te gustaría agendar una cita para este servicio?<br><br>` +
        `<button onclick="agendarServicioInteres('${nombreSeguro}')" ` +
        `style="background:#d81b60; color:white; border:none; padding:6px 12px; border-radius:8px; font-weight:bold; cursor:pointer;">` +
        `📅 Agendar este servicio</button>`
    );
}

// Cuando presionan "Agendar este servicio" dentro del chat
function agendarServicioInteres(nombreServicio) {
    agregarMensajeUsuario(`Agendar ${nombreServicio}`);
    setTimeout(() => iniciarAgendamiento(nombreServicio), 400);
}

// Detecta los clics en todos los botones "Ver más" y en el banner de cejas
document.addEventListener("click", function (e) {
    const boton = e.target.closest('.servicio-card .btn-rosa-pastel, .promo-btn[href="#cejas"]');
    if (!boton) return;

    e.preventDefault();

    // Banner de Laminado de cejas
    if (boton.matches(".promo-btn")) {
        const banner = boton.closest(".promo-banner");
        abrirChatConServicio(
            banner.querySelector("h3").textContent.trim(),
            "Cejas",
            banner.querySelector("p").textContent.trim()
        );
        return;
    }

    // Tarjetas de servicios
    const tarjeta = boton.closest(".servicio-card");
    const servicio = tarjeta.querySelector(".card-title").textContent.trim();
    const descripcion = tarjeta.querySelector(".card-text").textContent.trim();
    const seccion = boton.closest(".seccion-servicios").querySelector("h2").textContent.trim();

    abrirChatConServicio(servicio, seccion, descripcion);
});

/* ============================================================
   CHAT
   ============================================================ */

function manejarEnter(event) {
    if (event.key === "Enter") {
        enviarMensaje();
    }
}

function seleccionarOpcion(texto) {
    document.getElementById("user-input").value = texto;
    enviarMensaje();
}

function enviarMensaje() {
    const input = document.getElementById("user-input");
    const texto = input.value.trim();
    if (texto === "") return;

    agregarMensajeUsuario(texto);
    input.value = "";

    setTimeout(() => {
        procesarRespuesta(texto);
    }, 500);
}

function agregarMensajeUsuario(texto) {
    const chatBody = document.getElementById("chat-body");
    const div = document.createElement("div");
    div.className = "message user-message";
    div.textContent = texto;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function agregarMensajeBot(htmlTexto) {
    const chatBody = document.getElementById("chat-body");
    const div = document.createElement("div");
    div.className = "message bot-message";
    div.innerHTML = htmlTexto.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function procesarRespuesta(mensaje) {
    const msg = mensaje.toLowerCase();

    if (estadoAgendamiento.activo && (msg === "cancelar" || msg === "salir")) {
        estadoAgendamiento.activo = false;
        estadoAgendamiento.paso = 0;
        agregarMensajeBot("He cancelado el proceso de agendamiento. ¿En qué más te puedo colaborar? 😊");
        return;
    }

    if (estadoAgendamiento.activo) {
        gestionarFlujoCita(mensaje);
        return;
    }

    if (msg.includes("agendar") || msg.includes("cita") || msg.includes("reservar") || msg.includes("turno")) {
        iniciarAgendamiento();
        return;
    }

    if (msg.includes("horario") || msg.includes("abren") || msg.includes("cierran") || msg.includes("domingo") || msg.includes("festivo")) {
        agregarMensajeBot(
            `🕒 **Nuestros Horarios de Atención:**<br><br>` +
            `• **Lunes a Viernes:** 8:00 AM – 6:00 PM<br>` +
            `• **Sábados:** 7:00 AM – 7:00 PM<br>` +
            `• **Domingos y Festivos:** Solo con cita previa confirmada con mínimo **24 horas** de anticipación.<br><br>` +
            `⏳ *Recuerda:* Contamos con una tolerancia máxima de espera de **10 a 15 minutos** para tu cita.`
        );
        return;
    }

    if (msg.includes("balayage") || msg.includes("alisado") || msg.includes("keratina") || msg.includes("tinte") || msg.includes("color")) {
        agregarMensajeBot(
            `✨ **Servicios de Colorimetría y Alisados:**<br><br>` +
            `Para darte un presupuesto exacto en cambios de color, balayage o alisados, necesitamos realizar una **valoración previa**.<br><br>` +
            `📸 Puedes enviarnos fotos/videos de tu cabello actual por WhatsApp o agendar una cita de valoración presencial sin costo.<br>` +
            `⚠️ *Nota:* Estos servicios de alta duración requieren un **anticipo del 30%** para reservar el espacio.`
        );
        return;
    }

    if (msg.includes("servicio") || msg.includes("precio") || msg.includes("cabello") || msg.includes("masaje") || msg.includes("facial") || msg.includes("manicura") || msg.includes("pedicura") || msg.includes("cejas") || msg.includes("promo")) {
        agregarMensajeBot(
            `💇‍♀️ **Nuestros Servicios:**<br><br>` +
            `• Cabello Mujeres<br>` +
            `• Cabello Hombres<br>` +
            `• Masajes<br>` +
            `• Limpieza Facial<br>` +
            `• Manicura<br>` +
            `• Pedicura<br>` +
            `• Cejas<br><br>` +
            `🎁 **Promo Activa:** *Combo Martes* -> Por manicura y pedicura, **depilación de cejas gratis**.<br><br>` +
            `¿Te gustaría agendar alguno de estos servicios?`
        );
        return;
    }

    if (msg.includes("ubicacion") || msg.includes("ubicación") || msg.includes("donde") || msg.includes("dónde") || msg.includes("llegar")) {
        agregarMensajeBot(
            `📍 **Ubicación:**<br><br>` +
            `Estamos ubicados en: **${CONFIG_NEGOCIO.direccion}**.<br><br>` +
            `👉 <a href="${CONFIG_NEGOCIO.googleMaps}" target="_blank" style="color:#d81b60; font-weight:bold;">Abrir ubicación en Google Maps</a>`
        );
        return;
    }

    if (msg.includes("pago") || msg.includes("nequi") || msg.includes("daviplata") || msg.includes("bancolombia") || msg.includes("cancelar")) {
        agregarMensajeBot(
            `💳 **Medios de Pago y Políticas:**<br><br>` +
            `• **Aceptamos:** Efectivo, transferencias Nequi / Daviplata y Bancolombia.<br>` +
            `• **Anticipos:** Servicios largos o citas en domingos/festivos requieren **30% de anticipo**.<br>` +
            `• **Cancelaciones:** Gratuitas hasta con **4 horas de anticipación**.`
        );
        return;
    }

    if (msg.includes("humano") || msg.includes("persona") || msg.includes("dueña") || msg.includes("queja") || msg.includes("reclamo") || msg.includes("asesor")) {
        const urlDirecta = `https://wa.me/${CONFIG_NEGOCIO.whatsappReal}?text=Hola,%20necesito%20atención%20personalizada%20en%20Sala%20de%20Belleza%20Lily`;
        agregarMensajeBot(
            `👩‍💼 Entiendo perfectamente. Te comunico directamente con nuestra administradora para brindarte atención personalizada.<br><br>` +
            `👉 <a href="${urlDirecta}" target="_blank" style="color:#d81b60; font-weight:bold;">Hablar por WhatsApp ahora</a>`
        );
        return;
    }

    agregarMensajeBot(
        `Disculpa, no logré comprender del todo tu consulta 🤔. Puedo ayudarte con:<br><br>` +
        `1️⃣ **Agendar una cita**<br>` +
        `2️⃣ **Nuestros servicios**<br>` +
        `3️⃣ **Horarios de atención**<br>` +
        `4️⃣ **Ubicación en Google Maps**<br>` +
        `5️⃣ **Medios de pago**<br><br>` +
        `Escribe el tema que te interesa o selecciona un botón abajo.`
    );
}

/* ============================================================
   AGENDAMIENTO (ahora acepta un servicio ya elegido)
   ============================================================ */

function iniciarAgendamiento(servicioPrevio = "") {
    estadoAgendamiento.activo = true;
    estadoAgendamiento.paso = 1;
    estadoAgendamiento.datos = {
        nombre: "",
        telefono: "",
        servicio: servicioPrevio,
        fechaHora: ""
    };
    agregarMensajeBot(
        `¡Con gusto agendamos tu cita! 📅✨ *(Escribe "cancelar" en cualquier momento si deseas detener el registro)*<br><br>` +
        `Por favor, indícame tu **nombre completo**:`
    );
}

function gestionarFlujoCita(entrada) {
    switch (estadoAgendamiento.paso) {
        case 1:
            estadoAgendamiento.datos.nombre = entrada;
            estadoAgendamiento.paso = 2;
            agregarMensajeBot(`Gracias, **${entrada}**. Ahora indícame tu **número de teléfono / WhatsApp**:`);
            break;

        case 2:
            estadoAgendamiento.datos.telefono = entrada;
            if (estadoAgendamiento.datos.servicio) {
                // Ya viene con servicio desde un botón "Ver más": se salta ese paso
                estadoAgendamiento.paso = 4;
                agregarMensajeBot(
                    `Perfecto, agendaremos **${estadoAgendamiento.datos.servicio}**. ¿Para qué **fecha y hora** deseas tu cita?<br>` +
                    `*(Recuerda: Lun-Vie 8am-6pm | Sáb 7am-7pm | Domingos con 24h de anticipación)*`
                );
            } else {
                estadoAgendamiento.paso = 3;
                agregarMensajeBot(`¿Qué **servicio(s)** deseas realizarte? *(Cabello Mujeres, Cabello Hombres, Masajes, Limpieza Facial, Manicura, Pedicura o Cejas)*`);
            }
            break;

        case 3:
            estadoAgendamiento.datos.servicio = entrada;
            estadoAgendamiento.paso = 4;
            agregarMensajeBot(
                `Perfecto. ¿Para qué **fecha y hora** deseas tu cita?<br>` +
                `*(Recuerda: Lun-Vie 8am-6pm | Sáb 7am-7pm | Domingos con 24h de anticipación)*`
            );
            break;

        case 4:
            estadoAgendamiento.datos.fechaHora = entrada;
            finalizarAgendamiento();
            break;
    }
}

function finalizarAgendamiento() {
    const d = estadoAgendamiento.datos;
    const textoLower = (d.servicio + " " + d.fechaHora).toLowerCase();

    const requiereAnticipo =
        textoLower.includes("domingo") ||
        textoLower.includes("festivo") ||
        textoLower.includes("balayage") ||
        textoLower.includes("alisado") ||
        textoLower.includes("color") ||
        textoLower.includes("keratina");

    let notaRegla = "";
    if (requiereAnticipo) {
        notaRegla = `<br>⚠️ **Regla de Reserva:** Por ser cita en domingo/festivo o servicio de alta duración, se requiere un **anticipo del 30%** (Nequi / Daviplata / Bancolombia) para bloquear tu cupo.`;
    }

    let citasGuardadas = [];
    const guardadoPrevio = localStorage.getItem("citas_lily");
    if (guardadoPrevio) {
        citasGuardadas = guardadoPrevio.split("|||");
    }
    citasGuardadas.push(`${d.nombre} - ${d.telefono} - ${d.servicio} - ${d.fechaHora}`);
    localStorage.setItem("citas_lily", citasGuardadas.join("|||"));

    const mensajeWhatsApp = encodeURIComponent(
        `Hola Sala de Belleza Lily 🌸, deseo confirmar mi cita:\n` +
        `• Nombre: ${d.nombre}\n` +
        `• Teléfono: ${d.telefono}\n` +
        `• Servicio: ${d.servicio}\n` +
        `• Fecha/Hora: ${d.fechaHora}`
    );
    const linkWA = `https://wa.me/${CONFIG_NEGOCIO.whatsappReal}?text=${mensajeWhatsApp}`;

    agregarMensajeBot(
        `✅ **¡Pre-reserva registrada con éxito!**<br><br>` +
        `📋 **Resumen de tu cita:**<br>` +
        `• **Cliente:** ${d.nombre}<br>` +
        `• **Teléfono:** ${d.telefono}<br>` +
        `• **Servicio:** ${d.servicio}<br>` +
        `• **Fecha/Hora:** ${d.fechaHora}<br>` +
        `${notaRegla}<br><br>` +
        `⏰ *Recordatorio:* Te enviaremos aviso 24h y 2h antes. Tolerancia máxima: 15 min.<br><br>` +
        `👉 <a href="${linkWA}" target="_blank" style="background:#25D366; color:white; padding:6px 12px; border-radius:8px; text-decoration:none; display:inline-block; font-weight:bold;">Enviar confirmación a WhatsApp</a>`
    );

    estadoAgendamiento.activo = false;
    estadoAgendamiento.paso = 0;
}