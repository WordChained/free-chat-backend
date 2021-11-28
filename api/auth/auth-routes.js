const express = require('express')
const { login, signup, logout } = require('./auth-controller')

const router = express.Router()

router.get('/login', login)
router.post('/signup', signup)
router.post('/logout', logout)

module.exports = router