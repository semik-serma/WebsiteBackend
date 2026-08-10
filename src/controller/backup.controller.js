import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  getBackupFilePath,
} from '../utils/backupEngine.js';

export const getBackupsList = async (req, res) => {
  try {
    const backups = await listBackups();
    res.status(200).json({
      success: true,
      count: backups.length,
      backups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backups list',
      error: error.message,
    });
  }
};

export const triggerBackup = async (req, res) => {
  try {
    const label = req.body?.label || 'manual';
    const result = await createBackup(label);
    res.status(201).json({
      success: true,
      message: 'Database backup created successfully',
      backup: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message,
    });
  }
};

export const downloadBackupFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = getBackupFilePath(filename);

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }

    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to download backup',
      error: error.message,
    });
  }
};

export const restoreFromBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await restoreBackup(filename);
    res.status(200).json({
      success: true,
      message: 'Database successfully restored from backup snapshot',
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database restore failed',
      error: error.message,
    });
  }
};

export const removeBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const deleted = await deleteBackup(filename);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Backup file deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup file',
      error: error.message,
    });
  }
};
