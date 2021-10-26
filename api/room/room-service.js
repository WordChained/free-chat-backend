const dbService = require('../../services/db-service')
const ObjectId = require('mongodb').ObjectId
// const asyncLocalStorage = require('../../services/als-service')
const logger = require('../../services/logger-service')



const query = async (filterBy = '{}') => {
    // console.log('FILTER BY', filterBy)
    const criteria = _buildCriteria(JSON.parse(filterBy))
    // console.log('criteria:', criteria);
    try {
        const collection = await dbService.getCollection('room')
        const filteredRooms = await collection.find(criteria).toArray()
        const rooms = await collection.find().toArray()
        //Getting the tags when we can get all the rooms
        // if (!Object.keys(criteria).length) {
        //     tags = _getUniqeTags(rooms);
        // }
        return { rooms, filteredRooms };
    } catch (err) {
        logger.error('cannot find rooms', err)
        console.log('Error on room service =>', err)
        throw err
    }
}

const getById = async (roomId) => {
    try {
        const collection = await dbService.getCollection('room')
        const room = await collection.findOne({ '_id': ObjectId(roomId) })
        return room
    } catch (err) {
        logger.error(`while finding room ${roomId}`, err)
        console.log('Error on room service =>', err)
        throw err
    }
}

const remove = async (roomId) => {
    try {
        const collection = await dbService.getCollection('room')
        await collection.deleteOne({ '_id': ObjectId(roomId) })
    } catch (err) {
        logger.error(`cannot remove room ${roomId}`, err)
        console.log('Error on room service =>', err)
        throw err
    }
}

const add = async (room) => {
    try {
        const roomToAdd = {
            topic: room.topic,
            name: room.name,
            description: room.description,
            type: room.type,
            owner: room.owner,
            createdAt: Date.now(),
            imgUrl: room.imgUrl || '',
            tags: room.tags || [],
            likedByUsers: room.likedByUsers,
            restrictions: room.restrictions,
            limit: room.limit
        }
        const collection = await dbService.getCollection('room')
        await collection.insertOne(roomToAdd)
        return roomToAdd;
    } catch (err) {
        // logger.error('cannot add room', err)
        console.log('Error on room service =>', err)
        throw err
    }
}

const update = async (room) => {
    try {
        // peek only updatable fields!
        const roomToSave = {
            _id: ObjectId(room._id),
            topic: room.topic,
            name: room.name,
            description: room.description,
            owner: room.owner,
            // createdAt: room.createdAt,
            imgUrl: room.imgUrl || '',
            tags: room.tags,
            msgs: room.msgs || [],
            likedByUsers: room.likedByUsers,
            restrictions: room.restrictions,
            limit: room.limit

        }
        const collection = await dbService.getCollection('room')
        await collection.updateOne({ '_id': roomToSave._id }, { $set: roomToSave })
        return roomToSave;
    } catch (err) {
        // logger.error(`cannot update room ${room._id}`, err)
        console.log('Error on room service =>', err)
        throw err
    }

}


async function getMsgs(roomId) {
    if (!roomId) return []
    try {
        const room = await getById(roomId);
        const msgs = room.msgs || [];
        return msgs;
    } catch (err) {
        console.log('Cant get messages', err);
    }
}

async function addMsg(roomId, msg) {
    try {
        const collection = await dbService.getCollection('room')
        await collection.updateOne(
            { '_id': ObjectId(roomId) },
            {
                $push: {
                    'msgs': {
                        'text': msg.msg, id: ObjectId(),
                        'sentAt': Date.now(),
                        uid: msg.uid,
                        name: msg.name,
                        isEdit: msg.isEdit,
                        star: msg.star,
                        likes: msg.likes
                    }
                }
            })
        return await collection.findOne(ObjectId(roomId));
    } catch (err) {
        // logger.error(`cannot add message ${song.id}`, err)
        console.log('Error on room service =>', err)
    }
}
async function starMsg(roomId, uid, msgId) {
    try {
        const collection = await dbService.getCollection('room')
        await collection.updateMany(
            { '_id': ObjectId(roomId) },
            {
                //adds to array only if it doesnt hold the value
                $addToSet: {
                    //t is just a name for the nameless array
                    'msgs.$[t].star': uid
                }
            },
            {
                arrayFilters: [{ 't.id': ObjectId(msgId) }]
            },
            // { $eq: ObjectId(msgId)}
        )
        return await collection.findOne(ObjectId(roomId));
    } catch (err) {
        // logger.error(`cannot add message ${song.id}`, err)
        console.log('Error on room service =>', err)
    }
}
async function unStarMsg(roomId, uid, msgId) {
    try {
        const collection = await dbService.getCollection('room')
        await collection.updateMany(
            { '_id': ObjectId(roomId) },
            {
                $pull: {
                    'msgs.$[t].star': uid
                }
            },
            {
                arrayFilters: [{ 't.id': ObjectId(msgId) }]
            },
        )
        return await collection.findOne(ObjectId(roomId));
    } catch (err) {
        console.log('Error on room service =>', err)
    }

}
async function likeMsg(roomId, uid, msgId) {
    try {
        const collection = await dbService.getCollection('room')
        await collection.updateMany(
            { '_id': ObjectId(roomId) },
            {
                //adds to array only if it doesnt hold the value
                $addToSet: {
                    //'t' is just a name for the key-less objects
                    'msgs.$[t].likes': uid
                }
            },
            {
                arrayFilters: [{ 't.id': ObjectId(msgId) }]
            },
            // { $eq: ObjectId(msgId)}
        )
        return await collection.findOne(ObjectId(roomId));
    } catch (err) {
        // logger.error(`cannot add message ${song.id}`, err)
        console.log('Error on room service =>', err)
    }
}
async function unLikeMsg(roomId, uid, msgId) {
    try {
        const collection = await dbService.getCollection('room')
        await collection.updateMany(
            { '_id': ObjectId(roomId) },
            {
                $pull: {
                    'msgs.$[t].likes': uid
                }
            },
            {
                arrayFilters: [{ 't.id': ObjectId(msgId) }]
            },
        )
        return await collection.findOne(ObjectId(roomId));
    } catch (err) {
        console.log('Error on room service =>', err)
    }
}

function _buildCriteria(filterBy) {
    // console.log('filterBy:', filterBy);
    const criteria = {}
    //if theres a search term:
    if (filterBy.name) {
        criteria.name = { $regex: filterBy.name, $options: 'i' }
        // criteria.topic = { $regex: filterBy.topic, $options: 'i' }
        // criteria.description = { $regex: filterBy.description, $options: 'i' }
    }
    //if there are "tag filters"
    if (filterBy.tags && filterBy.tags.length) {
        criteria.tags = { $all: filterBy.tags.map(tag => tag.value) }
    }
    return criteria
}


// function _getUniqeTags(rooms) {
//     tags = rooms.reduce(
//         (acc, room) => {
//             acc.push(...room.tags);
//             return acc;
//         }, []
//     );
//     return Array.from(new Set(tags));
// }

module.exports = {
    query,
    getById,
    remove,
    add,
    update,
    getMsgs,
    addMsg,
    starMsg,
    unStarMsg,
    likeMsg,
    unLikeMsg
}