const MongoClient = require('mongodb').MongoClient
const logger = require('../services/logger-service')

const config = require('../config')


// Database Name
const dbName = 'free_chat_db'

var dbConn = null


const getCollection = async (collectionName) => {
    try {
        const db = await connect()
        const collection = await db.collection(collectionName)
        // collection.createIndex({ "$**": "text" })
        return collection
    } catch (err) {
        logger.error('Failed to get Mongo collection', err)
        // console.log('Failed to get Mongo collection', err)
        throw err
    }
}

const connect = async () => {
    if (dbConn) return dbConn
    try {
        const client = await MongoClient.connect(config.dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
        const db = client.db(dbName)
        dbConn = db
        return db
    } catch (err) {
        logger.error('Cannot Connect to DB', err)
        console.log('Cannot Connect to DB', err)
        throw err
    }
}

module.exports = {
    getCollection
}