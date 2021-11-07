const socketIo = require("socket.io");
const logger = require('./logger-service')

let numOfUsers = {}

const socketService = (server, session) => {
    const io = socketIo(server, {
        cors: {
            origin: ["http://localhost:3000", 'http://127.0.0.1:3000', 'https://wordchained.github.io/free-chat', 'https://free-chat-1.herokuapp.com', "http://localhost:3030"],
            // origin: '*', // doesnt work!
            // methods: ["GET", "POST", "DELETE", "PUT"],
            credentials: true,
        }
    });
    io.use((socket, next) => {
        session(socket.request, {}, next)
    })
    io.on('connect', (socket) => {
        console.log('New socket connected', socket.id);
        socket.emit('online-users', () => {
            return socket.adapter.sids.size
        })
        socket.on('disconnect', () => {
            console.log('socket disconnected');
        })
        socket.on('leave room', ({ topic, uid }) => {
            // if (numOfUsers[topic].length < 0) numOfUsers[topic] = 0
            console.log('leave room:', topic);
            socket.leave(topic)
            if (numOfUsers[topic]) {
                numOfUsers[topic] = numOfUsers[topic].filter(id => {
                    console.log(id !== uid);
                    return id !== uid
                })
                // console.log('users-in-room(leave):', numOfUsers[topic].length);
                // console.log('leave uid list:', numOfUsers[topic]);
                io.to(topic).emit('users-in-room', numOfUsers[topic].length)
            }
        })
        socket.on('room topic refresh', ({ topic, uid }) => {
            socket.join(topic)
            socket.myTopic = topic
            if (numOfUsers[topic] && numOfUsers[topic].includes(uid)) {
                // console.log('no need to add again');
            }
            else numOfUsers[topic] = [...numOfUsers[topic], uid]
            io.to(topic).emit('users-in-room', numOfUsers[topic].length)
        })
        socket.on('room topic', ({ topic, uid }) => {
            if (socket.myTopic === topic) return;
            if (socket.myTopic) {
                socket.leave(topic)
                if (numOfUsers[topic]) numOfUsers[topic] = numOfUsers[topic].filter(id => id !== uid)
                io.to(topic).emit('users-in-room', numOfUsers[topic].length)
                console.log('left in add');
            }
            socket.join(topic)
            socket.myTopic = topic
            // console.log(socket.request.res);
            if (!numOfUsers[topic]) {
                numOfUsers[topic] = [uid]
            } else if (!numOfUsers[topic].includes(uid)) {
                numOfUsers[topic] = [...numOfUsers[topic], uid]
            }
            // console.log('users-in-room(add):', numOfUsers[topic].length);
            io.to(topic).emit('users-in-room', numOfUsers[topic].length)
        })
        socket.on('check-num-of-users', (topic) => {
            if (!numOfUsers[topic]) return
            // console.log('req sent to know num of users', numOfUsers[topic].length);
            io.to(topic).emit('users-in-room', numOfUsers[topic].length)
        })
        socket.on('room newMsg', msg => {
            logger.debug('topic:', socket.myTopic, 'msg:', msg)
            // console.log(socket.rooms);
            io.to(socket.myTopic).emit('room addMsg', msg)
        })
    })
}

module.exports = {
    socketService
}