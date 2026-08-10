import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');  

import cors from 'cors'
import route from './src/router/auth.route.js';
import { commentroute } from './src/router/comment.route.js';
import { countrydetect } from './src/router/countrydetect.route.js';
import Articleroute from './src/router/article.route.js';
import { contactroute } from './src/router/contact.route.js';
import { visitcounter } from './src/controller/visitor.controller.js';
import { visitorroute } from './src/router/visitor.route.js';
import { userfelingroute } from './src/router/userfeling.route.js';
import reelRoute from './src/router/reel.route.js';
import friendRoute from './src/router/friend.route.js';
import chatRoute from './src/router/chat.route.js';
import notificationRoute from './src/router/notification.route.js';
import heartbeatRoute from './src/router/heartbeat.route.js';
import adminRoute from './src/router/admin.route.js';
import { connectdb } from "./src/config/db.js";

const app=express()
app.set('trust proxy', true)
app.use(express.json())
app.use(cors({origin:['http://localhost:2000','https://semik.phidimservice.com.np'],credentials:true}))

app.use(cors({origin:['http://localhost:3000','http://localhost:3001','http://localhost:3002','https://frontend-mu.vercel.app','https://semikdev.com','https://www.semikdev.com','https://semik.phidimservice.com.np'],credentials:true}))
connectdb()


app.use('/auth',route)
app.use('/article',Articleroute)
app.use('/',commentroute)
app.use('/countrydetect',countrydetect)
app.use('/contact',contactroute)
app.use('/visit',visitorroute)
app.use('/user',userfelingroute)
app.use('/heartbeat',heartbeatRoute)
app.use('/reel',reelRoute)
app.use('/friend',friendRoute)
app.use('/chat',chatRoute)
app.use('/notification',notificationRoute)
app.use('/admin',adminRoute)



const PORT = 2000;
app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`)
})