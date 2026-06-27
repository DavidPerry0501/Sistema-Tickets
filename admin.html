<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Panel Administrativo - Tickets</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        body { display: block; max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .grid-admin { display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; margin-top: 30px; }
        .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .scroll-lista { max-height: 70vh; overflow-y: auto; padding-right: 10px; }
        
        /* Sistema de Filtros Estilizados */
        .filtros-box { display: flex; gap: 8px; margin-bottom: 15px; }
        .filtro-btn { background: #14203a; border: 1px solid #1a2744; color: var(--texto-mutado); padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.2s; }
        .filtro-btn.active { background: var(--azul-premium); color: #fff; border-color: var(--azul-premium); }
    </style>
</head>
<body>
    <div class="panel-header">
        <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -1px;">🛡️ Panel Administrativo <span id="staff-identidad" style="font-size:16px; color:var(--azul-premium);"></span></h1>
    </div>

    <div class="filtros-box">
        <button class="filtro-btn active" id="f-todos" onclick="cambiarFiltro('Todos')">Todos</button>
        <button class="filtro-btn" id="f-abiertos" onclick="cambiarFiltro('Abiertos')">Abiertos ⬤</button>
        <button class="filtro-btn" id="f-reclamados" onclick="cambiarFiltro('Reclamados')">En Proceso ⬤</button>
    </div>

    <div class="grid-admin">
        <div>
            <div id="lista-tickets" class="scroll-lista"></div>
        </div>

        <div>
            <div id="detalle-ticket" class="container" style="max-width: 100%; display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 id="det-id" style="color: var(--azul-premium); font-size: 18px; font-weight: 700;">ID: -</h3>
                    <span id="det-tag" class="tag"></span>
                </div>
                <p><strong>Categoría:</strong> <span id="det-cat" style="color: #fff"></span></p>
                <p style="margin-bottom: 20px;"><strong>Urgencia:</strong> <span id="det-urg" style="color: #fff"></span></p>
                
                <label>Descripción del Problema</label>
                <p id="det-desc" style="background: var(--bg-principal); padding: 16px; border-radius: var(--borde-radio); border: 1px solid #1a2744; margin-bottom: 20px; font-size: 15px;"></p>

                <div id="user-typing-alert" style="color:var(--azul-premium); font-size:13px; font-style:italic; margin-bottom:12px; display:none; font-weight:600;">
                    👤 El usuario está escribiendo un mensaje en vivo...
                </div>

                <label>Respuesta Oficial</label>
                <textarea id="admin-respuesta" rows="3" placeholder="Escribe al usuario..."></textarea>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <button class="btn" id="btn-reclamar" style="background: #14203a; border: 1px solid #1a2744;">Reclamar</button>
                    <button class="btn" id="btn-responder" onclick="enviarRespuesta()">Enviar Respuesta</button>
                </div>
                <button class="btn" style="background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; margin-top: 15px;" onclick="eliminarTicketDefinitivo()">Cerrar y Eliminar Ticket</button>
            </div>

            <div id="no-seleccionado" class="container" style="max-width: 100%; text-align: center; color: var(--texto-mutado); padding: 50px 20px;">
                Selecciona un ticket para gestionarlo en tiempo real.
            </div>
        </div>
    </div>

    <audio id="sound-ticket" src="https://assets.mixkit.co/active_storage/sfx/1361/1361-84.wav" preload="auto"></audio>
    <audio id="sound-msg" src="https://assets.mixkit.co/active_storage/sfx/911/911-84.wav" preload="auto"></audio>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        // LÓGICA DIRECTA DEL PANEL ADMIN INTEGRADA
        const socket = io();
        let ticketSeleccionadoId = null;
        let todosLosTickets = [];
        let filtroActual = 'Todos';
        const miNombreStaff = localStorage.getItem('staff_name') || 'Staff';

        document.getElementById('staff-identidad').innerText = `(${miNombreStaff})`;

        async function cargarTicketsAdmin() {
            const res = await fetch('/api/tickets');
            todosLosTickets = await res.json();
            renderizarListaAdmin();
        }

        function cambiarFiltro(tipo) {
            filtroActual = tipo;
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
            if(tipo === 'Todos') document.getElementById('f-todos').classList.add('active');
            if(tipo === 'Abiertos') document.getElementById('f-abiertos').classList.add('active');
            if(tipo === 'Reclamados') document.getElementById('f-reclamados').classList.add('active');
            renderizarListaAdmin();
        }

        function renderizarListaAdmin() {
            const lista = document.getElementById('lista-tickets');
            lista.innerHTML = '';

            let filtrados = todosLosTickets;
            if(filtroActual === 'Abiertos') filtrados = todosLosTickets.filter(t => t.style || t.estado === 'Abierto');
            if(filtroActual === 'Reclamados') filtrados = todosLosTickets.filter(t => t.estado === 'Reclamado');

            if(filtrados.length === 0) {
                lista.innerHTML = '<p style="color:var(--texto-mutado); text-align:center;">No hay tickets en este filtro.</p>';
                return;
            }

            filtrados.forEach(t => {
                const item = document.createElement('div');
                item.className = 'container';
                item.style.padding = '15px'; item.style.marginBottom = '12px'; item.style.cursor = 'pointer';
                item.style.border = ticketSeleccionadoId === t.id ? '2px solid var(--azul-premium)' : '1px solid #1a2744';
                item.onclick = () => mostrarDetalle(t.id);
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700;">#${t.id.slice(-6)} [${t.urgencia}]</span>
                        <span class="tag ${t.estado}">● ${t.estado}</span>
                    </div>
                    <div style="font-size:13px; margin-top:6px; color:var(--texto-mutado); text-align:left;">${t.categoria}</div>
                `;
                lista.appendChild(item);
            });
        }

        function mostrarDetalle(id) {
            ticketSeleccionadoId = id;
            socket.emit('join_ticket', id);
            document.getElementById('no-seleccionado').style.display = 'none';
            const contenedor = document.getElementById('detalle-ticket');
            contenedor.style.display = 'block';

            const ticket = todosLosTickets.find(t => t.id === id);
            if(ticket) {
                document.getElementById('det-id').innerText = `ID TICKET: #${ticket.id.slice(-6)}`;
                document.getElementById('det-tag').className = `tag ${ticket.estado}`;
                document.getElementById('det-tag').innerText = `● ${ticket.estado}`;
                document.getElementById('det-cat').innerText = ticket.categoria;
                document.getElementById('det-urg').innerText = ticket.urgencia;
                document.getElementById('det-desc').innerText = ticket.descripcion;
                
                const btnRec = document.getElementById('btn-reclamar');
                if(ticket.estado === 'Reclamado') {
                    btnRec.innerText = 'Reclamado'; btnRec.disabled = true; btnRec.style.opacity = 0.5;
                } else {
                    btnRec.innerText = 'Reclamar'; btnRec.disabled = false; btnRec.style.opacity = 1;
                    btnRec.onclick = () => socket.emit('update_status', { ticketId: id, nuevoEstado: 'Reclamado', logMessage: `Ticket tomado por ${miNombreStaff}.` });
                }
            }
            renderizarListaAdmin();
        }

        // Emitir señal de que el staff escribe al usuario
        document.getElementById('admin-respuesta').addEventListener('input', (e) => {
            if(ticketSeleccionadoId) {
                socket.emit('send_typing_signal', { ticketId: ticketSeleccionadoId, isTyping: e.target.value.length > 0, origen: 'Staff' });
            }
        });

        function enviarRespuesta() {
            const input = document.getElementById('admin-respuesta');
            if(!input.value.trim() || !ticketSeleccionadoId) return;

            socket.emit('send_message', { ticketId: ticketSeleccionadoId, remitente: miNombreStaff, texto: input.value.trim() });
            socket.emit('send_typing_signal', { ticketId: ticketSeleccionadoId, isTyping: false, origen: 'Staff' });
            input.value = '';
        }

        function eliminarTicketDefinitivo() {
            if(ticketSeleccionadoId) {
                socket.emit('update_status', { ticketId: ticketSeleccionadoId, nuevoEstado: 'Cerrado' });
                document.getElementById('detalle-ticket').style.display = 'none';
                document.getElementById('no-seleccionado').style.display = 'block';
                ticketSeleccionadoId = null;
            }
        }

        // Escuchar alertas de escritura del usuario
        socket.on('user_typing_status', (data) => {
            if(ticketSeleccionadoId === data.ticketId) {
                document.getElementById('user-typing-alert').style.display = data.isTyping ? 'block' : 'none';
            }
        });

        socket.on('play_sound_signal', (tipo) => {
            if(tipo === 'new_ticket') document.getElementById('sound-ticket').play();
            if(tipo === 'new_message_admin') document.getElementById('sound-msg').play();
        });

        socket.on('ticket_list_updated', (t) => { todosLosTickets = t; renderizarListaAdmin(); if(ticketSeleccionadoId) mostrarDetalle(ticketSeleccionadoId); });
        window.onload = cargarTicketsAdmin;
    </script>
</body>
</html>