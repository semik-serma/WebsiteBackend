import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

/**
 * Creates a full database backup snapshot saved as a timestamped JSON file.
 */
export const createBackup = async (label = 'manual') => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected. Cannot perform backup.');
  }

  const db = mongoose.connection.db;
  const collections = await db.collections();
  const backupData = {
    metadata: {
      version: '1.0.0',
      label,
      createdAt: new Date().toISOString(),
      databaseName: db.databaseName,
      totalCollections: 0,
      totalDocuments: 0,
    },
    collections: {},
  };

  let totalDocs = 0;

  for (const collection of collections) {
    const colName = collection.collectionName;
    // Skip internal system collections
    if (colName.startsWith('system.')) continue;

    const docs = await collection.find({}).toArray();
    backupData.collections[colName] = docs;
    totalDocs += docs.length;
    backupData.metadata.totalCollections += 1;
  }

  backupData.metadata.totalDocuments = totalDocs;

  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);

  const filename = `backup_${label}_${timestamp}.json`;
  const filePath = path.join(BACKUPS_DIR, filename);

  await fs.promises.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

  const stats = await fs.promises.stat(filePath);

  // Auto-prune older backups to keep the last 15
  await pruneOldBackups(15);

  return {
    filename,
    filePath,
    sizeBytes: stats.size,
    sizeFormatted: formatBytes(stats.size),
    metadata: backupData.metadata,
  };
};

/**
 * Lists all available backup files with their metadata and file details.
 */
export const listBackups = async () => {
  if (!fs.existsSync(BACKUPS_DIR)) return [];

  const files = await fs.promises.readdir(BACKUPS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  const list = [];

  for (const file of jsonFiles) {
    const filePath = path.join(BACKUPS_DIR, file);
    try {
      const stats = await fs.promises.stat(filePath);
      // Read header metadata without loading massive body if possible, or parse safely
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      list.push({
        filename: file,
        sizeBytes: stats.size,
        sizeFormatted: formatBytes(stats.size),
        createdAt: stats.mtime.toISOString(),
        metadata: parsed.metadata || {
          createdAt: stats.mtime.toISOString(),
          totalCollections: Object.keys(parsed.collections || {}).length,
          totalDocuments: Object.values(parsed.collections || {}).reduce(
            (acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0),
            0
          ),
        },
      });
    } catch (e) {
      // If corrupted file, list basic info
      list.push({
        filename: file,
        corrupted: true,
      });
    }
  }

  // Sort newest first
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Restores the database from a specified backup file.
 */
export const restoreBackup = async (filename) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected. Cannot perform restore.');
  }

  // Sanitize filename to prevent directory traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(BACKUPS_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file ${safeFilename} does not exist.`);
  }

  const raw = await fs.promises.readFile(filePath, 'utf-8');
  const backupData = JSON.parse(raw);

  if (!backupData.collections || typeof backupData.collections !== 'object') {
    throw new Error('Invalid backup file format: missing collections.');
  }

  const db = mongoose.connection.db;
  const restoredSummary = {};

  for (const [colName, docs] of Object.entries(backupData.collections)) {
    if (!Array.isArray(docs)) continue;

    const collection = db.collection(colName);

    // Clear existing collection data safely
    await collection.deleteMany({});

    if (docs.length > 0) {
      // Re-hydrate ObjectIds and Dates if they were serialized
      const hydratedDocs = docs.map((doc) => hydrateDocument(doc));
      await collection.insertMany(hydratedDocs);
    }

    restoredSummary[colName] = docs.length;
  }

  return {
    restoredFrom: safeFilename,
    restoredAt: new Date().toISOString(),
    collections: restoredSummary,
  };
};

/**
 * Deletes a specific backup file.
 */
export const deleteBackup = async (filename) => {
  const safeFilename = path.basename(filename);
  const filePath = path.join(BACKUPS_DIR, safeFilename);

  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
    return true;
  }
  return false;
};

/**
 * Gets absolute path for downloading a backup file.
 */
export const getBackupFilePath = (filename) => {
  const safeFilename = path.basename(filename);
  const filePath = path.join(BACKUPS_DIR, safeFilename);
  if (!fs.existsSync(filePath)) return null;
  return filePath;
};

/**
 * Prunes older backups beyond the retention limit.
 */
const pruneOldBackups = async (maxKeep = 15) => {
  try {
    const list = await listBackups();
    if (list.length > maxKeep) {
      const toDelete = list.slice(maxKeep);
      for (const item of toDelete) {
        await deleteBackup(item.filename);
      }
    }
  } catch (err) {
    console.error('Error pruning old backups:', err.message);
  }
};

/**
 * Automatically schedule daily backups every 24 hours.
 */
let backupInterval = null;
export const scheduleAutoBackup = () => {
  if (backupInterval) return;

  console.log('🛡️ Auto Backup Scheduler initialized (running every 24 hours).');

  // Trigger an initial safety backup on startup (non-blocking)
  setTimeout(async () => {
    try {
      const result = await createBackup('startup');
      console.log(`🛡️ Initial startup backup created: ${result.filename} (${result.sizeFormatted})`);
    } catch (e) {
      console.warn('Initial startup backup skipped:', e.message);
    }
  }, 5000);

  // Run every 24 hours (86,400,000 ms)
  backupInterval = setInterval(async () => {
    try {
      const result = await createBackup('daily_auto');
      console.log(`🛡️ Automated daily backup created: ${result.filename} (${result.sizeFormatted})`);
    } catch (e) {
      console.error('Automated daily backup failed:', e.message);
    }
  }, 24 * 60 * 60 * 1000);
};

// Helper: Formats bytes to human-readable size
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper: Recursively restore MongoDB specific types (BSON ObjectId, Dates)
function hydrateDocument(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(hydrateDocument);
  }

  const hydrated = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_id' && typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
      hydrated[key] = new mongoose.Types.ObjectId(value);
    } else if (
      (key.endsWith('At') || key === 'date' || key === 'lastSeen') &&
      typeof value === 'string' &&
      !isNaN(Date.parse(value))
    ) {
      hydrated[key] = new Date(value);
    } else if (value && typeof value === 'object') {
      hydrated[key] = hydrateDocument(value);
    } else {
      hydrated[key] = value;
    }
  }
  return hydrated;
}
