const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const corsOptions = require('./config/corsOptions');
const dotenv = require('dotenv');
const helmet = require('helmet');
const scheduleRoutes = require('./routes/schedules');
const appointmentRoutes = require('./routes/appointments');
const medicalRecordRoutes = require('./routes/medicalRecords');
const prescriptionRoutes = require('./routes/prescriptions');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const doctorRoutes = require('./routes/doctors');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: corsOptions.allowedOrigins || 'http://localhost:3000',
        methods: corsOptions.methods || ['GET', 'POST'],
        credentials: corsOptions.credentials ?? true
    }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Socket.IO connection handling
const onlineUsers = new Map();

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const { userId, name, role } = socket.handshake.query;

    if (!token) {
        return next(new Error('Authentication token required'));
    }

    if (!userId || !name || !role) {
        return next(new Error('User information incomplete'));
    }

    // Store user data in socket
    socket.userData = { userId, name, role };
    next();
});

io.on('connection', (socket) => {
    console.log('New client connected with data:', socket.userData);

    socket.on('join', (userData) => {
        try {
            console.log('Join event received:', userData);
            
            if (!userData || !userData.userId || !userData.name || !userData.role) {
                console.error('Invalid join data received:', userData);
                socket.emit('error', { message: 'Invalid user data provided' });
                return;
            }

            // Store user data in the online users map
            onlineUsers.set(socket.id, userData);
            console.log('User joined successfully:', userData.name);
            
            // Broadcast updated online users list
            const onlineUsersList = Array.from(onlineUsers.values());
            console.log('Broadcasting online users:', onlineUsersList);
            io.emit('updateOnlineUsers', onlineUsersList);
        } catch (error) {
            console.error('Error in join handler:', error);
            socket.emit('error', { message: 'Failed to process join request' });
        }
    });

    socket.on('sendMessage', async (messageData) => {
        try {
            console.log('Message received:', messageData);

            // Validate message data
            if (!messageData || !messageData.userId || !messageData.name || !messageData.content || !messageData.role) {
                console.error('Invalid message data:', messageData);
                socket.emit('error', { message: 'Invalid message data' });
                return;
            }

            // Create new message
            const ChatMessage = require('./models/Chat');
            const message = new ChatMessage({
                userId: messageData.userId,
                name: messageData.name,
                role: messageData.role,
                content: messageData.content,
                timestamp: messageData.timestamp || new Date()
            });

            // Save message to database
            await message.save();
            console.log('Message saved successfully:', message);

            // Broadcast message to all clients
            io.emit('message', message);
        } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('error', { 
                message: 'Failed to save message',
                details: error.message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.userData?.name);
        onlineUsers.delete(socket.id);
        io.emit('updateOnlineUsers', Array.from(onlineUsers.values()));
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/doctors', doctorRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 