const express = require('express')
const cors = require('cors')
const path = require('path')
// const expressSession = require('express-session')
// const httpProxy = require('http-proxy')

const app = express()
app.use((err, req, res, next) => {
    console.log(err);
    if (err) {
        return res.status(err.status).send({ "error": err.message });
    }
    next();
});
const http = require('http')
const server = http.createServer(app)
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PUT"],
        credentials: true,
    }
})

// const io = new Server(http);
// const io = new Server(server, {
//     cors: {
//         origin: "*"
//     }
// });

// app.use(passport.initialize());
// app.use(passport.session());

// const session = expressSession({
//     secret: 'coding is amazing',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }
// })
// Express App Config
app.use(express.json())
// app.use(session)
app.use(express.static('public'))
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
    console.log(__dirname);
} else {
    const corsOptions = {
        origin: ['http://127.0.0.1:8080', 'http://localhost:8080', 'http://localhost:3000',
            'http://localhost:8081', 'http://127.0.0.1:3030', 'http://127.0.0.1:3000', 'http://localhost:3030',
            'http://192.168.1.17:8080/', 'http://192.168.1.22:8080'
        ],
        credentials: true
    }
    // const allowCrossDomain = function (req, res, next) {
    //     res.header('Access-Control-Allow-Origin', '*');
    //     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    //     res.header('Access-Control-Allow-Headers', 'Content-Type');
    //     next();
    // }
    app.use(cors(corsOptions))
    // app.use(allowCrossDomain)
}

const authRoutes = require('./api/auth/auth-routes')
const userRoutes = require('./api/user/user-routes')
const roomRoutes = require('./api/room/room-routes')
const { connectSockets } = require('./services/socket-service')

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
connectSockets(server)


// Make every server-side-route to match the index.html
// so when requesting http://localhost:3030/index.html/car/123 it will still respond with
// our SPA (single page app) (the index.html file) and allow vue/react-router to take it from there
// app.get('/**', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'))
// })

const logger = require('./services/logger-service')
const port = process.env.PORT || 3030


server.listen(port, () => {
    logger.info('Server is running on port: ' + port)
    // console.log('Server is running on port: ' + port)
})