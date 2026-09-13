import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    updateUserRole,
    getAllReels,
    deleteReel,
    getAllArticles,
    deleteArticle,
} from '../controller/admin.controller.js';
import {
    getBackupsList,
    triggerBackup,
    downloadBackupFile,
    restoreFromBackup,
    removeBackup,
} from '../controller/backup.controller.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', updateUserRole);
router.put('/users/:id/role', updateUserRole);
router.get('/reels', getAllReels);
router.delete('/reels/:id', deleteReel);
router.get('/articles', getAllArticles);
router.delete('/articles/:id', deleteArticle);

// Disaster Recovery & Backup Routes
router.get('/backups', getBackupsList);
router.post('/backups/create', triggerBackup);
router.get('/backups/download/:filename', downloadBackupFile);
router.post('/backups/restore/:filename', restoreFromBackup);
router.delete('/backups/:filename', removeBackup);

export default router;
