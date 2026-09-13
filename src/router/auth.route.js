import express from 'express'
import { login, logout, registerSecond, verifyuser, getGoogleAuthUrl, googleAuthCallback } from '../controller/auth.controller.js'



const route = express.Router()
// route.post('/register', register)
route.post('/register', registerSecond)
route.post('/verifyuser', verifyuser)

route.post('/loginuser', login)
route.get('/logout', logout)

// Google OAuth routes
route.get('/google/url', getGoogleAuthUrl)
route.post('/google/callback', googleAuthCallback)


export default route