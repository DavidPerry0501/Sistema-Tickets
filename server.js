import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// 🌐 EL PUERTO SE ADAPTA AUTOMÁTICAMENTE A RENDER
const PORT = process.env.PORT || 8080;

// 🔍 ENCONTRAR LA RUTA REAL (RAÍZ PRINCIPAL DONDE ESTÁN TUS ARCHIVOS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio para guardar los tickets
const DATA_DIR = path.join(__dirname, 'data'); 
const DATA_FILE = path.join(DATA_DIR, 'tickets.json');
const RATING_FILE = path.join(DATA_DIR, 'calificaciones.json');

app.use(express.json());

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 🛡️ FILTRO DE SEGURIDAD PANEL ADMIN CON TU CONTRASEÑA "Staff2026"
app.get('/admin.html', (req, res, next) => {
    const claveCorrecta = 'Staff2026'; 
    const claveUsuario = req.query.pass;

    if (claveUsuario === claveCorrecta) {
        next();
    } else {
        res.status(403).send('<h1 style="color:#ff4d4d; text-align:center; margin-top:50px; font-family:sans-serif;">❌ Acceso Denegado: Contraseña incorrecta.</h1>');
    }
});

// 🖥️ LEER ESTILOS Y SCRIPTS DIRECTAMENTE DESDE LA RAÍZ REAL
app.use(express.static(__dirname));

// Forzar la entrega de index.html en la raíz del enlace
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Funciones de base de datos en JSON
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
    ratings.push({ ...ratingData, fecha: new Date().toLocaleString() });
    fs.writeFileSync(RATING_FILE, JSON.stringify(ratings, null, 2));
};

app.get('/api/tickets', (req, res) => res.json(readTickets()));

// ⚡ LÓGICA DE WEBSOCKETS EN TIEMPO REAL (SOCKET.IO)
io.on('connection', (socket) => {
    socket.on('join_ticket', (ticketId) => socket.join(ticketId));

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
    });
});

// 🔥 CONEXIÓN ABIERTA PARA EL HOSTING EN REDER
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ¡SISTEMA EN VIVO EN RENDER! Corriendo en el puerto ${PORT}`);
});
