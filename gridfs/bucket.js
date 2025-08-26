// gridfs/bucket.js (CommonJS)
/**
 * Single GridFS bucket factory (singleton).
 * Provides a unique GridFSBucket instance to upload/read/delete files.
 * Requires an active Mongoose connection.
 */
const mongoose = require('mongoose');
const { GridFSBucket } = mongoose.mongo; 

let bucket = null;

/**
 * Returns the singleton GridFSBucket.
 * Throws if MongoDB is not connected yet.
 */
function getGridFSBucket() {
  if (bucket) return bucket;

  const conn = mongoose.connection;
  // 1 === connected
  if (conn.readyState !== 1 || !conn.db) {
    throw new Error('MongoDB is not connected yet (GridFS).');
  }

  // Use a dedicated bucket name for curriculum photos
  bucket = new GridFSBucket(conn.db, { bucketName: 'curriculum_photos' });

  // Recommended GridFS indexes (idempotent)
  conn.db.collection('curriculum_photos.chunks')
    .createIndex({ files_id: 1, n: 1 }, { unique: true })
    .catch(() => {}); // ignore "already exists" and minor errors
  conn.db.collection('curriculum_photos.files')
    .createIndex({ filename: 1, uploadDate: 1 })
    .catch(() => {});

  return bucket;
}

// Optional: warm up bucket right after the DB connection opens.
// Note: this handler runs only if this module gets imported somewhere.
mongoose.connection.once('open', () => {
  try { getGridFSBucket(); } catch (e) {}
});

module.exports = { getGridFSBucket };
