const express = require('express')
const { login, signup, logout } = require('./auth-controller')

const router = express.Router()

// router.post('/login', login)
// router.post('/signup', signup)
router.get('/login', login)
router.get('/signup', signup)
router.post('/logout', logout)

module.exports = router