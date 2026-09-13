import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getConversations, getOrCreateChat, getMessages,
    sendMessage
} from '../controller/chat.controller.js';

const chatRoute = express.Router();

chatRoute.get('/conversations', authenticate, getConversations);
chatRoute.get('/with/:userId', authenticate, getOrCreateChat);
chatRoute.get('/messages/:chatId', authenticate, getMessages);
chatRoute.post('/send', authenticate, sendMessage);

export default chatRoute;
