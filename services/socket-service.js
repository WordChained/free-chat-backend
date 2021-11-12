const socketIo = require("socket.io");
const logger = require('./logger-service');

let numOfUsers = {}
let privateRooms = {}
let limitedRooms = {}

const users = []

const getRandomIntInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

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
                    // console.log(id !== uid);
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
            if (numOfUsers[topic]) {
                if (numOfUsers[topic].includes(uid)) {
                    // console.log('no need to add again');
                }
                else numOfUsers[topic] = [...numOfUsers[topic], uid]
                io.to(topic).emit('users-in-room', numOfUsers[topic].length)
            }
        })
        socket.on('room topic', ({ topic, uid }) => {
            if (socket.myTopic === topic) return;
            if (socket.myTopic) {
                socket.leave(topic)
                if (numOfUsers[topic]) {
                    numOfUsers[topic] = numOfUsers[topic].filter(id => id !== uid)
                    io.to(topic).emit('users-in-room', numOfUsers[topic].length)
                    console.log('left in add');
                }
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
            if (!numOfUsers[topic] || !numOfUsers[topic].length) return
            // console.log('req sent to know num of users', numOfUsers[topic].length);
            io.to(topic).emit('users-in-room', numOfUsers[topic].length)
        })
        socket.on('join-private-room', ({ uid, topics }) => {
            if (socket.inRoom) return
            console.log('joining room...')
            if (users.length <= 1) {
                if (!users.find(user => user.uid === uid)) {
                    users.push({ uid, topics })
                    socket.join(uid)
                }
                console.log('no other users right now');
                setTimeout(() => {
                    return io.to(uid).emit('private-room-enter-msg', 'waiting for somone else to join!')
                }, 2000)
            } else {//if there are 2 or more people in the lobby
                const potentialMatches = users.filter(user => {
                    if (user.uid === uid) return false
                    return user.topics.some(userTopic => {
                        console.log('userTopic:', userTopic);
                        return topics.includes(userTopic)
                    })
                })
                console.log('potentialMatches:', potentialMatches);
                if (!potentialMatches.length) {//creating a room
                    if (!users.find(user => user.uid === uid)) users.push({ uid, topics })//adding to 'lobby'
                    socket.join(uid)
                    socket.inRoom = uid
                    setTimeout(() => {
                        return io.to(uid).emit('private-room-enter-msg', 'You are connected, waiting for another user...')
                    }, 2000)
                } else {//joining a room
                    const randNum = getRandomIntInclusive(0, potentialMatches.length - 1)
                    const randUser = potentialMatches[randNum]//one user from the potential list
                    const idx = users.findIndex(user => user.uid === randUser.uid)//his index
                    users.splice(idx, 1)//remove him from the array so no other users can join!
                    socket.join(randUser.uid)//join the ready room
                    socket.inRoom = randUser.uid
                    setTimeout(() => {
                        return io.to(socket.inRoom).emit('private-room-enter-msg', 'You are connected, say hello!')
                    }, 2000)
                }
            }
        })
        socket.on('leave-private-room', ({ uid, topics }) => {
            if (!socket.inRoom || users.includes(uid)) return
            console.log('leaving room...');
            users.push({ uid, topics })//adding to 'lobby'
            socket.leave(socket.inRoom)
            io.to(socket.inRoom).emit('private-room-enter-msg', uid === socket.inRoom ? 'You left the room.' : 'other user disconnected.')
        })
        //later i can find users by their uid and choose who i speak to!
        // io.on("connection", socket => {
        //     socket.on("private message", (anotherSocketId, msg) => {
        //       socket.to(anotherSocketId).emit("private message", socket.id, msg);
        //     });
        //   });
        socket.on('room newMsg', msg => {
            // logger.debug('topic:', socket.myTopic, 'msg:', msg)
            // console.log(socket.rooms);
            io.to(socket.myTopic).emit('room addMsg', msg)
        })
        socket.on('private-room-msg', msg => {
            // logger.debug('topic:', socket.myTopic, 'msg:', msg)
            // console.log(socket.rooms);
            io.to(socket.inRoom).emit('private-room-add-msg', msg)
        })
    })
}

module.exports = {
    socketService
}