const socket = io();
let ticketActivoId = null;
let todosLosTickets = [];

// Variables para el sistema de feedback
let notaSeleccionada = 0;
let datosTicketCerrado = { staff: 'Ninguno', categoria: 'General', id: '' };

function abrirModalStaff() {
    document.getElementById('staff-pass-input').value = '';
    document.getElementById('staff-error-msg').style.display = 'none';
    document.getElementById('modal-staff').style.display = 'flex';
}
function cerrarModalStaff() {
    document.getElementById('modal-staff').style.display = 'none';
}

async function verificarClaveStaff() {
    const clave = document.getElementById('staff-pass-input').value;
    const nombre = document.getElementById('staff-name-input').value.trim() || 'Staff';
    const errorDiv = document.getElementById('staff-error-msg');
    
    if(!clave.trim()) return;

    const res = await fetch(`/admin.html?pass=${encodeURIComponent(clave)}`);
    if (res.status === 200) {
        localStorage.setItem('staff_name', nombre);
        window.location.href = `/admin.html?pass=${encodeURIComponent(clave)}`;
    } else {
        errorDiv.style.display = 'block';
    }
}

function nextStep(s) {
    document.querySelectorAll('.step').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step-${s}`).classList.remove('hidden');
}

function enviarTicket() {
    const categoria = document.getElementById('categoria').value;
    const descripcion = document.getElementById('descripcion').value;
    const urgencia = document.getElementById('urgencia').value;
    if(!descripcion.trim()) return nextStep(2);
    socket.emit('create_ticket', { categoria, urgencia, descripcion });
}

function resetFormulario() {
    document.getElementById('descripcion').value = '';
    document.getElementById('success-msg').classList.add('hidden');
    nextStep(1);
}

socket.on('ticket_created_success', () => {
    document.querySelectorAll('.step').forEach(el => el.classList.add('hidden'));
    document.getElementById('success-msg').classList.remove('hidden');
    cargarListaTickets();
});

document.addEventListener('DOMContentLoaded', () => {
    const inputChat = document.getElementById('user-msg-input');
    if(inputChat) {
        inputChat.addEventListener('input', () => {
            if(ticketActivoId) {
                socket.emit('send_typing_signal', { ticketId: ticketActivoId, isTyping: inputChat.value.length > 0, origen: 'Usuario' });
            }
        });
    }
});

async function cargarListaTickets() {
    const res = await fetch('/api/tickets');
    todosLosTickets = await res.json();
    renderizarLista(todosLosTickets);
}

function renderizarLista(tickets) {
    const contenedor = document.getElementById('mis-tickets');
    contenedor.innerHTML = '';
    if(tickets.length === 0) {
        contenedor.innerHTML = '<p style="color:var(--texto-mutated); text-align:center;">No tienes ningún ticket activo.</p>';
        return;
    }
    [...tickets].reverse().forEach(t => {
        const item = document.createElement('div');
        item.style.background = '#080f1d'; item.style.padding = '14px 18px'; item.style.borderRadius = '10px'; item.style.marginBottom = '10px'; item.style.cursor = 'pointer';
        item.style.border = ticketActivoId === t.id ? '2px solid var(--azul-premium)' : '1px solid #14203a';
        item.onclick = () => abrirChatTicket(t.id);
        item.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;"><span style="font-weight:700; color:#fff;">#${t.id.slice(-6)} - ${t.categoria}</span><span class="tag ${t.estado}">● ${t.estado}</span></div>`;
        contenedor.appendChild(item);
    });
}

function abrirChatTicket(id) {
    ticketActivoId = id;
    socket.emit('join_ticket', id);
    document.getElementById('chat-ticket-box').style.display = 'block';
    const ticket = todosLosTickets.find(t => t.id === id);
    if(ticket) {
        const box = document.getElementById('chat-messages'); box.innerHTML = '';
        ticket.chat.forEach(m => agregarMensajePantalla(m));
        document.getElementById('chat-estado').className = `tag ${ticket.estado}`;
        document.getElementById('chat-estado').innerText = `● ${ticket.estado}`;
        document.getElementById('chat-input-area').style.display = ticket.estado === 'Cerrado' ? 'none' : 'flex';
        box.scrollTop = box.scrollHeight;
    }
}

function enviarMensajeChat() {
    const input = document.getElementById('user-msg-input');
    const texto = input.value.trim();
    if(!texto || !ticketActivoId) return;
    socket.emit('send_message', { ticketId: ticketActivoId, remitente: 'Usuario', texto });
    socket.emit('send_typing_signal', { ticketId: ticketActivoId, isTyping: false, origen: 'Usuario' });
    input.value = '';
}

function agregarMensajePantalla(m) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `msg ${m.remitente === 'Usuario' ? 'Usuario' : 'Staff'}`;
    div.innerHTML = `<div style="font-size:11px; font-weight:700; opacity:0.7;">${m.remitente === 'Usuario' ? '👤 TÚ' : '🛡️ ' + m.remitente.toUpperCase()}</div><div>${m.texto}</div><span class="msg-meta">${m.fecha}</span>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// Lógica de interacción con estrellas
function marcarEstrellas(nota) {
    notaSeleccionada = nota;
    const estrellas = document.querySelectorAll('.star');
    estrellas.forEach((star, index) => {
        if (index < nota) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function enviarCalificacionFinal() {
    if(notaSeleccionada === 0) {
        alert("Por favor selecciona al menos 1 estrella antes de enviar.");
        return;
    }
    socket.emit('submit_rating', {
        ticketId: datosTicketCerrado.id,
        categoria: datosTicketCerrado.categoria,
        staff: datosTicketCerrado.staff,
        estrellas: notaSeleccionada
    });
    document.getElementById('modal-calificacion').style.display = 'none';
    notaSeleccionada = 0;
}

socket.on('staff_typing_status', (isTyping) => {
    const box = document.getElementById('chat-messages');
    let existe = document.getElementById('aviso-escribiendo');
    if(isTyping && !existe) {
        const div = document.createElement('div'); div.id = 'aviso-escribiendo'; div.style.color = 'var(--texto-mutated)'; div.style.fontSize = '12px'; div.innerText = '🛡️ El staff está escribiendo...';
        box.appendChild(div); box.scrollTop = box.scrollHeight;
    } else if (!isTyping && existe) existe.remove();
});

socket.on('new_chat_message', (m) => { if(m.remitente !== 'Usuario') agregarMensajePantalla(m); });
socket.on('play_sound_signal', (tipo) => { if(tipo === 'new_message_user') document.getElementById('sound-ping').play(); });

// Escuchar evento de cierre modificado
socket.on('status_changed', (data) => {
    if(data.estado === 'Cerrado') {
        document.getElementById('chat-input-area').style.display = 'none';
        document.getElementById('chat-ticket-box').style.display = 'none';
        
        // Guardamos los metadatos del ticket cerrado para procesar la nota
        datosTicketCerrado.id = ticketActivoId;
        datosTicketCerrado.staff = data.atendidoPor || 'Staff';
        datosTicketCerrado.categoria = data.categoria || 'General';

        ticketActivoId = null;

        // Desplegar modal de estrellas
        document.getElementById('calif-staff-name').innerText = datosTicketCerrado.staff;
        marcarEstrellas(0);
        document.getElementById('modal-calificacion').style.display = 'flex';
    }
});

socket.on('ticket_list_updated', (t) => { todosLosTickets = t; renderizarLista(t); });
window.onload = cargarListaTickets;