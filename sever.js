const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Sajikan file statis dari folder saat ini
app.use(express.static(path.join(__dirname, '/')));

// Database Memory Sementara (Hilang saat server direstart)
const rooms = {};

// Fungsi helper buat ID unik
function generateId(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}

io.on('connection', (socket) => {
    console.log(`Koneksi baru: ${socket.id}`);

    // Membuat Room
    socket.on('createRoom', (data, callback) => {
        const roomId = generateId(8);
        const token = generateId(16);
        rooms[roomId] = {
            token: token,
            users: new Set(),
            messages: [],
            sequence: 0
        };
        console.log(`Room dibuat: ${roomId}`);
        callback({ success: true, roomId, token });
    });

    // Bergabung ke Room
    socket.on('joinRoom', (data, callback) => {
        const { roomId, token, senderId } = data;
        
        if (!rooms[roomId]) return callback({ success: false, message: "Room ID tidak ditemukan." });
        if (rooms[roomId].token !== token) return callback({ success: false, message: "Token sesi tidak valid." });
        if (!senderId || senderId.trim() === "") return callback({ success: false, message: "Sender ID harus diisi." });

        // Bergabung ke room socket
        socket.join(roomId);
        rooms[roomId].users.add(senderId);
        
        console.log(`${senderId} bergabung ke room ${roomId}`);

        // Kirim riwayat pesan ke user yang baru join
        callback({ success: true, messages: rooms[roomId].messages });
    });

    // Mengirim Pesan
    socket.on('sendMessage', (data, callback) => {
        const { roomId, senderId, text, asciiBinary, manchester, checksum } = data;
        
        if (!rooms[roomId]) return callback({ success: false, message: "Room tidak ditemukan atau sudah ditutup." });

        const seq = rooms[roomId].sequence++;
        
        const messageObj = {
            sequence: seq,
            senderId: senderId,
            text: text,
            asciiBinary: asciiBinary,
            manchester: manchester,
            checksum: checksum,
            timestamp: Date.now()
        };

        // Simpan ke riwayat room
        rooms[roomId].messages.push(messageObj);

        // Broadcast ke SEMUA pengguna dalam room
        io.to(roomId).emit('receiveMessage', messageObj);
        
        callback({ success: true });
    });

    socket.on('disconnect', () => {
        console.log(`Koneksi terputus: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log('=============================================');
    console.log(`EncodeX Server berjalan pada http://localhost:${PORT}`);
    console.log('=============================================');
});
