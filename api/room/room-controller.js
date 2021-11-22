const logger = require('../../services/logger-service')
const roomService = require('../room/room-service')
// const socketService = require('../../services/socket-service')

let checkPrivateDupMsg = ''
let checkDupMsg = ''

const getRooms = async (req, res) => {
    try {
        const { filterBy } = req.query;
        // console.log('filterBy', filterBy);
        const data = await roomService.query(filterBy)
        res.send(data)
    } catch (err) {
        logger.error('Cannot get rooms', err)
        // console.log('Error on room controller =>', err)
        res.status(500).send({ err: 'Failed to get rooms' })
    }
}

const getRoom = async (req, res) => {
    try {
        const room = await roomService.getById(req.params.id)
        res.send(room)
    } catch (err) {
        logger.error('Failed to get room', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: 'Failed to get room' })
    }
}

const deleteRoom = async (req, res) => {
    try {
        await roomService.remove(req.params.id)
        res.send({ msg: 'Deleted successfully' })
    } catch (err) {
        logger.error('Failed to delete room', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: 'Failed to delete room' })
    }
}


const addRoom = async (req, res) => {
    try {
        const room = req.body
        const savedRoom = await roomService.add(room)
        // socketService.broadcast({ type: 'room-added', data: savedRoom })
        res.send(savedRoom)

    } catch (err) {
        logger.error('Failed to add room', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: 'Failed to add room' })
    }
}




const updateRoom = async (req, res) => {
    try {
        const room = req.body
        const savedRoom = await roomService.update(room)
        res.send(savedRoom)
    } catch (err) {
        logger.error('Failed to update room', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: 'Failed to update room' })
    }
}


const getMsgs = async (req, res) => {
    try {
        const unfilteredMsgs = await roomService.getMsgs(req.params.id);
        const msgs = [...new Set(unfilteredMsgs)]
        res.send(msgs)
    } catch (err) {
        logger.error('Cannot get messages', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: 'Failed to get messages' })
    }
}
const getPrivateMsgs = async (req, res) => {
    try {
        const unfilteredMsgs = await roomService.getPrivateMsgs(req.params.id);
        const msgs = [...new Set(unfilteredMsgs)]//not sure i need this now
        console.log('msgs:', msgs);
        res.send(msgs)
    } catch (err) {
        logger.error('Cannot get messages', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: 'Failed to get messages' })
    }
}

const addMsg = async (req, res) => {
    try {
        const newMsg = req.body;
        console.log('newMsg.ticket:', newMsg.ticket);
        if (newMsg.ticket === checkDupMsg) {
            console.log('%%% same message (' + newMsg.ticket + ') was submitted twice %%%');
            return
        }
        checkDupMsg = newMsg.ticket
        const savedRoom = await roomService.addMsg(req.params.id, newMsg);
        res.send(savedRoom);
    } catch (err) {
        logger.error('Failed to add a message to this room', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: 'Failed to add a message to this room' })
    }
}
const addPrivateMsg = async (req, res) => {
    try {
        console.log('times')
        const newMsg = req.body
        if (newMsg.ticket === checkPrivateDupMsg) {
            console.log('%%% privateCHat same message (' + newMsg.ticket + ') was submitted twice %%%');
            return
        }
        checkPrivateDupMsg = newMsg.ticket
        console.log('why not?: &&&&&&&&&&&&&&&&', req.params.id, newMsg);
        const savedRoom = await roomService.addPrivateMsg(req.params.id, newMsg);
        console.log('savedRoom:', savedRoom);
        res.send(savedRoom);
    } catch (err) {
        logger.error('Failed to add a message to this room', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: 'Failed to add a message to this room' })
    }
}
const addPrivateChat = async (req, res) => {
    try {
        const { chatId } = req.body;
        const savedPrivateChat = await roomService.addPrivateChat(req.params.id, chatId);
        res.send(savedPrivateChat);
    } catch (err) {
        logger.error('Failed to add private chat', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: 'Failed to add private chat' })
    }
}
const starMsg = async (req, res) => {
    const { uid, msgId } = req.body;
    try {
        const savedRoom = await roomService.starMsg(req.params.id, uid, msgId);
        res.send(savedRoom);

    } catch (err) {
        logger.error('Failed to star a the msg with the id', msgId + '.', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: `Failed to star a the msg with the id ${msgId}` })
    }
}
const unStarMsg = async (req, res) => {
    const { uid, msgId } = req.body;
    try {
        const savedRoom = await roomService.unStarMsg(req.params.id, uid, msgId);
        res.send(savedRoom);

    } catch (err) {
        logger.error('Failed to unstar a the msg with the id', msgId + '.', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: `Failed to unstar a the msg with the id ${msgId}` })
    }
}
const likeMsg = async (req, res) => {
    const { uid, msgId } = req.body;
    try {
        const savedRoom = await roomService.likeMsg(req.params.id, uid, msgId);
        res.send(savedRoom);

    } catch (err) {
        logger.error('Failed to like a the msg with the id', msgId + '.', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: `Failed to like a the msg with the id ${msgId}` })
    }
}

const unLikeMsg = async (req, res) => {
    const { uid, msgId } = req.body;
    try {
        const savedRoom = await roomService.unLikeMsg(req.params.id, uid, msgId);
        res.send(savedRoom);

    } catch (err) {
        logger.error('Failed to unlike a the msg with the id', msgId + '.', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: `Failed to unlike a the msg with the id ${msgId}` })
    }
}

const deleteMsg = async (req, res) => {
    const { msgId, roomId } = req.body
    try {
        const savedRoom = await roomService.deleteMsg(msgId, roomId)
        res.send(savedRoom)
    } catch (err) {
        logger.error('Failed to remove msg with the id', msgId + '.', err)
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: `Failed to remove msg with the id ${msgId}` })
    }
}

const deletePrivateChat = async (req, res) => {
    const { chatId } = req.body
    console.log('deletePrivateChat', chatId);
    try {
        await roomService.deletePrivateChat(chatId)
    } catch (err) {
        console.log('Error on room controller =>', err)
        res.status(500).send({ err: `Failed to remove chat with the id ${chatId}` })
    }
}

module.exports = {
    getRooms,
    getRoom,
    deleteRoom,
    addRoom,
    updateRoom,
    getMsgs,
    addMsg,
    starMsg,
    unStarMsg,
    likeMsg,
    unLikeMsg,
    deleteMsg,
    addPrivateMsg,
    getPrivateMsgs,
    deletePrivateChat,
    addPrivateChat
}