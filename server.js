const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors')
const path = require('path')
const expressSession = require('express-session')
const session = expressSession({
    secret: 'coding is amazing',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
})

const app = express()
app.use(session)
const server = http.createServer(app);
const port = process.env.PORT || 3030
const logger = require('./services/logger-service')

server.listen(port, () => {
    logger.info('Server is running on port: ' + port)
    // console.log('Server is running on port: ' + port)
})

app.get('/api/setup-session', (req, res) => {
    req.session.connectedAt = Date.now()
    console.log('setup-session:', req.sessionID);
    res.end()
})

app.use(express.json())

app.use((err, req, res, next) => {
    console.log(err);
    if (err) {
        return res.status(err.status).send({ "error": err.message });
    }
    next();
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
    console.log(__dirname);
} else {
    const corsOptions = {
        origin: ['http://127.0.0.1:8080', 'http://localhost:8080', 'http://localhost:3000',
            'http://localhost:8081', 'http://127.0.0.1:3030', 'http://127.0.0.1:3000', 'http://localhost:3030',
            'http://192.168.1.17:8080/', 'http://192.168.1.22:8080',
        ],
        credentials: true
    }
    app.use(cors(corsOptions))
}
const authRoutes = require('./api/auth/auth-routes')
const userRoutes = require('./api/user/user-routes')
const roomRoutes = require('./api/room/room-routes')
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/room', roomRoutes)


const { socketService } = require('./services/socket-service')
socketService(server, session)
// const io = socketIo(server);