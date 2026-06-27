import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// 🌐 CONFIGURACIÓN DEL PUERTO AUTOMÁTICO PARA RAILWAY
const PORT = process.env.PORT || 3000;

// 🔄 ENRUTAMIENTO DINÁMICO ABSOLUTO PARA EVITAR ERRORES EN LA NUBE
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data'); 
const DATA_FILE = path.join(DATA_DIR, 'tickets.json');
const RATING_FILE = path.join(DATA_DIR, 'calificaciones.json');

app.use(express.json());

// 📁 ASEGURAR QUE LA CARPETA 'data' EXISTA DENTRO DEL PROYECTO
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 🛡️ FILTRO DE SEGURIDAD PARA EL PANEL ADMIN
app.get('/admin.html', (req, res, next) => {
    const claveCorrecta = 'Staff2026'; // <-- CAMBIA TU CONTRASEÑA AQUÍ
    const claveUsuario = req.query.pass;

    if (claveUsuario === claveCorrecta) {
        next();
    } else {
        res.status(403).send('<h1 style="color:#ff4d4d; text-align:center; margin-top:50px; font-family:sans-serif;">❌ Acceso Denegado: No tienes permisos para entrar aquí.</h1>');
    }
});

// 🖥️ SERVIR LA CARPETA PÚBLICA USANDO LA RUTA ABSOLUTA
app.use(express.static(path.join(__dirname, 'public')));
// Redirigir automáticamente a los usuarios al index si entran al link limpio
app.get/('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

// Funciones de lectura y escritura seguras
const readTickets = () => {
    if (!fs.existsSync(DATA_FILE) || fs.readFileSync(DATA_FILE, 'utf-8').trim() === '') {
        fs.writeFileSync(DATA_FILE, '[]');
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
};

const writeTickets = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

const saveRating = (ratingData) => {
    if (!fs.existsSync(RATING_FILE) || fs.readFileSync(RATING_FILE, 'utf-8').trim() === '') {
        fs.writeFileSync(RATING_FILE, '[]');
    }
    const ratings = JSON.parse(fs.readFileSync(RATING_FILE, 'utf-8'));
    ratings.push({
        ...ratingData,
        fecha: new Date().toLocaleString()
    });
    fs.writeFileSync(RATING_FILE, JSON.stringify(ratings, null, 2));
};

// API Endpoint para cargar los tickets activos
app.get('/api/tickets', (req, res) => res.json(readTickets()));

// ⚡ SISTEMA DE WEBSOCKETS EN TIEMPO REAL (SOCKET.IO)
io.on('connection', (socket) => {
    console.log('⚡ Usuario conectado mediante WebSockets:', socket.id);

    socket.on('join_ticket', (ticketId) => {
        socket.join(ticketId);
    });

    socket.on('create_ticket', (datosTicket) => {
        const tickets = readTickets();
        const newTicket = {
            id: Date.now().toString(),
            categoria: datosTicket.categoria,
            urgencia: datosTicket.urgencia,
            descripcion: datosTicket.descripcion,
            estado: 'Abierto',
            atendidoPor: 'Ninguno',
            chat: [],
            logs: [`[${new Date().toLocaleString()}] Ticket creado.`]
        };
        tickets.push(newTicket);
        writeTickets(tickets);

        io.emit('ticket_list_updated', tickets);
        io.emit('play_sound_signal', 'new_ticket');
        socket.emit('ticket_created_success', newTicket.id);
    });

    socket.on('send_message', (data) => {
        const { ticketId, remitente, texto } = data;
        const tickets = readTickets();
        const idx = tickets.findIndex(t => t.id === ticketId);

        if (idx !== -1) {
            if (!tickets[idx].chat) tickets[idx].chat = [];

            const nuevoMensaje = {
                remitente,
                texto,
                fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            tickets[idx].chat.push(nuevoMensaje);
            
            if (remitente !== 'Usuario' && tickets[idx].estado === 'Abierto') {
                tickets[idx].estado = 'Reclamado';
                tickets[idx].atendidoPor = remitente;
                tickets[idx].logs.push(`[${new Date().toLocaleString()}] Ticket tomado por ${remitente}.`);
            }

            writeTickets(tickets);
            io.to(ticketId).emit('new_chat_message', nuevoMensaje);
            io.emit('ticket_list_updated', tickets);

            if (remitente === 'Usuario') {
                io.emit('play_sound_signal', 'new_message_admin');
            } else {
                io.to(ticketId).emit('play_sound_signal', 'new_message_user');
            }
        }
    });

    socket.on('send_typing_signal', (data) => {
        const { ticketId, isTyping, origen } = data;
        if (origen === 'Staff') {
            socket.to(ticketId).emit('staff_typing_status', isTyping);
        } else {
            socket.to(ticketId).emit('user_typing_status', { ticketId, isTyping });
        }
    });

    socket.on('update_status', (data) => {
        const { ticketId, nuevoEstado, logMessage } = data;
        let tickets = readTickets();
        const ticketInfo = tickets.find(t => t.id === ticketId);

        if (nuevoEstado === 'Cerrado' && ticketInfo) {
            io.to(ticketId).emit('status_changed', { 
                estado: 'Cerrado', 
                atendidoPor: ticketInfo.atendidoPor,
                categoria: ticketInfo.categoria
            });
            
            tickets = tickets.filter(t => t.id !== ticketId);
            writeTickets(tickets);
            io.emit('ticket_list_updated', tickets);
        } else {
            const idx = tickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) {
                tickets[idx].estado = nuevoEstado;
                if(logMessage) tickets[idx].logs.push(`[${new Date().toLocaleString()}] ${logMessage}`);
                writeTickets(tickets);

                io.to(ticketId).emit('status_changed', { estado: nuevoEstado });
                io.emit('ticket_list_updated', tickets);
            }
        }
    });

    socket.on('submit_rating', (ratingData) => {
        saveRating(ratingData);
        console.log(`⭐ Calificación procesada para ${ratingData.staff}: ${ratingData.estrellas} estrellas.`);
    });
});

// 🔥 CONFIGURACIÓN DE ESCUCHA GLOBAL EN INTERNET ('0.0.0.0')
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ¡SISTEMA EN VIVO EN INTERNET! Corriendo en el puerto ${PORT}`);
});
