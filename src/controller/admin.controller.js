import User from '../models/userModels.js';
import { Article } from '../models/articleModels.js';
import { Chat } from '../models/chatModel.js';
import { Message } from '../models/messageModel.js';
import { FriendRequest } from '../models/friendRequestModel.js';
import { Notification } from '../models/notificationModel.js';

export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalArticles = await Article.countDocuments();
        const totalChats = await Chat.countDocuments();
        res.json({ totalUsers, totalArticles, totalChats });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user && req.user._id && req.user._id.toString() === id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
        }
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await Article.deleteMany({ author: user.email });
        const chats = await Chat.find({ participants: id });
        const chatIds = chats.map(c => c._id);
        await Message.deleteMany({ chat: { $in: chatIds } });
        await Chat.deleteMany({ participants: id });
        await FriendRequest.deleteMany({ $or: [{ sender: id }, { receiver: id }] });
        await Notification.deleteMany({ user: id });
        await User.findByIdAndDelete(id);

        res.json({ success: true, message: 'User and all associated data deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !['ADMIN', 'USER'].includes(role.toUpperCase())) {
            return res.status(400).json({ success: false, message: "Invalid role. Role must be 'ADMIN' or 'USER'" });
        }

        const normalizedRole = role.toUpperCase();

        if (req.user && req.user._id && req.user._id.toString() === id && normalizedRole === 'USER') {
            return res.status(400).json({ success: false, message: 'You cannot demote your own admin account' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.role = normalizedRole;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.email} role updated to ${normalizedRole}`,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                firstname: user.firstname,
                lastname: user.lastname
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating user role', error: error.message });
    }
};

export const getAllArticles = async (req, res) => {
    try {
        const articles = await Article.find().sort({ createdAt: -1 });
        res.json({ articles });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching articles', error: error.message });
    }
};

export const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await Article.findByIdAndDelete(id);
        if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
        res.json({ success: true, message: 'Article deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting article', error: error.message });
    }
};

