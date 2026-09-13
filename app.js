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
import friendRoute from './src/router/friend.route.js';
import chatRoute from './src/router/chat.route.js';
import notificationRoute from './src/router/notification.route.js';
import heartbeatRoute from './src/router/heartbeat.route.js';
import adminRoute from './src/router/admin.route.js';
import { connectdb } from "./src/config/db.js";
import { scheduleAutoBackup, createBackup } from './src/utils/backupEngine.js';

// --- Crash & Disaster Recovery Shields ---
process.on('uncaughtException', async (err) => {
  console.error('💥 [CRASH GUARD] Uncaught Exception intercepted:', err.message, err.stack);
  try {
    // Attempt emergency backup snapshot before anything is lost
    await createBackup('emergency_crash');
    console.log('🛡️ [CRASH GUARD] Emergency backup snapshot secured.');
  } catch (backupErr) {
    console.error('Failed to create emergency backup:', backupErr.message);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.warn('⚠️ [CRASH GUARD] Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

const app=express()
app.set('trust proxy', true)
app.use(express.json())
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:2000',
  'https://frontend-mu.vercel.app',
  'https://semikdev.com',
  'https://www.semikdev.com',
  'https://semik.phidimservice.com.np',
  'https://portfolio.phidimservice.com.np'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

// Connect Database & Start Auto Backup Engine
connectdb().then(() => {
  scheduleAutoBackup();
}).catch((err) => {
  console.error('Database connection failed:', err);
});


app.use('/auth',route)
app.use('/article',Articleroute)
app.use('/',commentroute)
app.use('/countrydetect',countrydetect)
app.use('/contact',contactroute)
app.use('/visit',visitorroute)
app.use('/user',userfelingroute)
app.use('/heartbeat',heartbeatRoute)
app.use('/friend',friendRoute)
app.use('/chat',chatRoute)
app.use('/notification',notificationRoute)
app.use('/admin',adminRoute)



const PORT = 2000;
app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`)
})