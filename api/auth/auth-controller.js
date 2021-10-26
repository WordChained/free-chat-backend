const authService = require('./auth-service')
const logger = require('../../services/logger-service')

const login = async (req, res) => {
    const { userName, password } = req.body
    try {
        const user = await authService.login(userName, password)
        req.session.user = user
        res.json(user)
    } catch (err) {
        logger.error('Failed to Login ' + err)
        res.status(401).send({ err: 'Failed to Login' })
    }
}

const signup = async (req, res) => {
    try {
        const { userName, password, fullName, imgUrl, likedRooms, birthday, email, sex, createdAt } = req.body
        // Never log passwords
        // logger.debug(fullName + ', ' + userName + ', ' + password)

        const account = await authService.signup(userName, password, fullName, imgUrl, likedRooms, birthday, email, sex, createdAt)
        logger.debug(`auth-route - new account created: ` + JSON.stringify(account))
        const user = await authService.login(userName, password)
        req.session.user = user
        res.json(user)
    } catch (err) {
        logger.error('Failed to signup ' + err)
        res.status(500).send({ err: 'Failed to signup' })
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.send({ msg: 'Logged out successfully' })
    } catch (err) {
        res.status(500).send({ err: 'Failed to logout' })
    }
}

module.exports = {
    login,
    signup,
    logout
}