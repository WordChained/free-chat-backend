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
    io.use((socket,next)=>{
        session(socket.request,{},next)
    })
    io.on('connect', (socket) => {
        console.log('New socket connected', socket.id);
        socket.emit('online-users', () => {
            return socket.adapter.sids.size
        })
        socket.on('disconnect', () => {
            console.log('socket disconnected');
        })
        socket.on('leave room', topic => {
            if (numOfUsers[topic] < 0) numOfUsers[topic] = 0
            console.log('leave room:', topic);
            socket.leave(topic)
            if (numOfUsers[topic]) {
                numOfUsers[topic]--
                console.log('users-in-room(leave):', numOfUsers[topic]);
                io.to(topic).emit('users-in-room', numOfUsers[topic])
            }
        })
        socket.on('room topic refresh',topic=>{
            socket.join(topic)
            socket.myTopic = topic
            io.to(topic).emit('users-in-room', numOfUsers[topic])
        })
        socket.on('room topic', topic => {
            if (socket.myTopic === topic) return;
            if (socket.myTopic) {
                socket.leave(topic)
                numOfUsers[topic]--
                io.to(topic).emit('users-in-room', numOfUsers[topic])
                console.log('left in add');
            }
            socket.join(topic)
            socket.myTopic = topic
            // console.log(socket.request.res);
            if (!numOfUsers[topic]) {
                numOfUsers[topic] = 1
            } else {
                numOfUsers[topic]++
            }
            console.log('users-in-room(add):', numOfUsers[topic]);
            io.to(topic).emit('users-in-room', numOfUsers[topic])
        })
        socket.on('check-num-of-users', (topic) => {
            console.log('req sent to know num of users', numOfUsers[topic]);
            io.to(topic).emit('users-in-room', numOfUsers[topic])
        })
        socket.on('room newMsg', msg => {
            logger.debug('topic:', socket.myTopic, 'msg:', msg)
            console.log(socket.rooms);
            io.to(socket.myTopic).emit('room addMsg', msg)
        })
    })
}

module.exports = {
    socketService
}