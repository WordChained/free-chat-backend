const bcrypt = require('bcrypt')
const userService = require('../user/user-service')
const logger = require('../../services/logger-service')


const login = async (userName, password) => {
    logger.debug(`auth-service - login with userName: ${userName}`)
    const user = await userService.getByUsername(userName)
    if (!user) return Promise.reject('Invalid userName or password')
    const match = await bcrypt.compare(password, user.password)
    if (!match) return Promise.reject('Invalid userName or password')

    delete user.password
    return user
}

const signup = async (userName, password, fullName, imgUrl, likedRooms, birthday, email, sex, createdAt) => {
    const saltRounds = 10
    // logger.debug('USER:', userName, password, fullName, imgUrl, likedRooms, birthday, email)
    logger.debug(`auth-service - signup with userName: ${userName}, fullName: ${fullName}`)
    if (!userName || !password || !fullName) return Promise.reject('fullName, userName and password are required!')

    const hash = await bcrypt.hash(password, saltRounds)
    return userService.add({ userName, password: hash, fullName, imgUrl, likedRooms, birthday, email, sex, createdAt })
}

module.exports = {
    signup,
    login,
}