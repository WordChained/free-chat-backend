const express = require("express");
const http = require("http");
// const socketIo = require("socket.io");
const cors = require('cors')
// const path = require('path')
// const publicPath = path.join(__dirname, 'build')
const expressSession = require('express-session')

const app = express()
app.get('/api/test', (req, res) => {
    console.log('OK')
    res.send('OK')
})

const server = http.createServer(app);

const session = expressSession({
    secret: 'coding is amazing',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
})

app.use(express.json())
app.use(session)
// app.use(express.static('build'))

// console.log('publicPath:', publicPath);
if (process.env.NODE_ENV === 'production') {
    console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
    // app.use(express.static(path.resolve(__dirname, 'build')))
    // app.use(express.static(publicPath))
    // // const corsOptions = {
    // //     origin: '*',
    // //     credentials: true
    // // }
    // // app.use(cors(corsOptions))
    // console.log('__dirname:', __dirname);


    // const corsOptions = {
    //     origin: ['https://free-chat-1.herokuapp.com', 'https://free-chat-frontend.herokuapp.com'],
    //     credentials: true
    // }
    // app.use(cors(corsOptions))
} else {
    const corsOptions = {
        // originWhitelist: [],
        origin: ['http://127.0.0.1:8080', 'http://localhost:8080', 'http://localhost:3000',
            'http://localhost:8081', 'http://127.0.0.1:3030', 'http://127.0.0.1:3000', 'http://localhost:3030',
            'http://192.168.1.17:8080/', 'http://192.168.1.22:8080',
        ],
        credentials: true
    }
    app.use(cors(corsOptions))
    // app.use(cors())
}

const authRoutes = require('./api/auth/auth-routes')
const userRoutes = require('./api/user/user-routes')
const roomRoutes = require('./api/room/room-routes')

const { socketService } = require('./services/socket-service')

// routes
const setupAsyncLocalStorage = require('./middlewares/setupAls.middleware')
app.all('*', setupAsyncLocalStorage)

// tip: check with app.use
app.get('/api/setup-session', (req, res) => {
    req.session.connectedAt = Date.now()
    console.log('setup-session:', req.sessionID);
    res.end()
})

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/room', roomRoutes)

socketService(server, session)

// Make every server-side-route to match the index.html
// so when requesting http://localhost:3030/index.html/car/123 it will still respond with
// our SPA (single page app) (the index.html file) and allow vue/react-router to take it from there
// app.get('/*', (req, res) => {
//     res.sendFile(path.join(publicPath, 'index.html'))
// })

const logger = require('./services/logger-service')
const port = process.env.PORT || 3030

server.listen(port, () => {
    logger.info('Server is running on port: ' + port)
    // console.log('Server is running on port: ' + port)
})