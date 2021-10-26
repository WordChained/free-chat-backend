const socketIo = require("socket.io");
const logger = require('./logger-service')


const socketService = (server, session) => {
    const io = socketIo(server, {
        cors: {
            origin: ["http://localhost:3000", 'http://127.0.0.1:3000', 'https://wordchained.github.io/free-chat'],
            methods: ["GET", "POST", "DELETE", "PUT"],
            credentials: true,
        }
    });
    io.on('connect', (socket) => {
        console.log('New socket connected', socket.id);
        socket.on('disconnect', () => {
            console.log('socket disconnected');
        })
        // socket.on('test', response)
        socket.on('room topic', topic => {
            if (socket.myTopic === topic) return;
            if (socket.myTopic) {
                socket.leave(socket.myTopic)
            }
            socket.join(topic)
            socket.myTopic = topic
        })
        socket.on('room newMsg', msg => {
            logger.debug('topic:', socket.myTopic, 'msg:', msg)
            console.log(socket.rooms);
            io.to(socket.myTopic).emit('room addMsg', msg)
        })
        socket.on('room watch', roomId => {
            logger.debug('room watch', roomId)
            if (socket.roomId === roomId) return;
            if (socket.roomId) {
                socket.leave(socket.roomId);
            }
            // socket.join('watching:' + roomId)
            socket.join(roomId)
            socket.roomId = roomId;
        })
        socket.on('set-room-socket', roomId => {
            logger.debug(`Setting socket.roomId = ${roomId}`)
            socket.roomId = roomId
        })
        socket.on('unset-room-socket', () => {
            delete socket.roomId
        })
        socket.on('room updated', (updatedRoom) => {
            socket.to(updatedRoom._id).emit("room updated", updatedRoom);
        })
    })
}

module.exports = {
    socketService
}