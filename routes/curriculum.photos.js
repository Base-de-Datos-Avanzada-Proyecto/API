// routes/curriculum.photos.js (CommonJS)
/**
 * Routes to manage Curriculum photos:
 * - POST   /:curriculumId/photos   (upload)
 * - GET    /:curriculumId/photos   (list metadata)
 * - GET    /files/:fileId          (stream file)
 * - DELETE /:curriculumId/photos/:fileId (remove)
 */
const express = require('express');
const multer = require('multer');
const { Readable } = require('stream');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { Types, connection } = require('mongoose');

const Curriculum = require('../models/Curriculum');         
const { getGridFSBucket } = require('../gridfs/bucket');     // singleton bucket

const router = express.Router();

// Multer with in-memory storage, 5MB max, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Images only (jpg, png, webp, gif).'));
  },
});

const toObjectId = (id) => (Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null);


/**
 * POST /api/curricula/:curriculumId/photos
 * Form-Data: photo (file), caption (optional)
 * Uploads to GridFS and stores metadata + fileId in Curriculum.photos[]
 */
router.post('/:curriculumId/photos', upload.single('photo'), async (req, res) => {
  try {
    const curriculumId = toObjectId(req.params.curriculumId);
    if (!curriculumId) return res.status(400).json({ error: 'Invalid curriculumId' });

    const doc = await Curriculum.findById(curriculumId);
    if (!doc) return res.status(404).json({ error: 'Curriculum not found' });

    // TODO: authorization (ensure requester owns this curriculum or has a proper role)
    if (!req.file) return res.status(400).json({ error: 'Attach the file in field "photo"' });

    const bucket = getGridFSBucket();
    const ext = path.extname(req.file.originalname) || '';
    const filename = crypto.randomBytes(12).toString('hex') + ext;

    // Upload to GridFS (with metadata)
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: {
        curriculumId: doc._id.toString(),
        professionalId: doc.professionalId?.toString() || null,
      },
    });

    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    // Read the created file doc to get length/uploadDate/contentType
    const file = await mongoose.connection.db
      .collection('curriculum_photos.files')
      .findOne({ _id: uploadStream.id });

    const photoMeta = {
      fileId: file._id,
      filename: file.filename,
      contentType: file.contentType,
      length: file.length,
      uploadDate: file.uploadDate,
      caption: req.body?.caption || '',
      isMain: doc.photos.length === 0, // first photo becomes cover
    };

    try {
      // $addToSet prevents duplicates; push is fine too if you already check duplicates
      // doc.photos.push(photoMeta);
      await Curriculum.updateOne(
        { _id: doc._id },
        { $addToSet: { photos: photoMeta } }
      );
    } catch (e) {
      // Rollback GridFS file if DB write fails
      try { await bucket.delete(file._id); } catch {}
      throw e;
    }

    res.status(201).json({ ok: true, photo: photoMeta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

/**
 * GET /api/curricula/:curriculumId/photos
 * Returns the photos[] metadata of the curriculum
 */
router.get('/:curriculumId/photos', async (req, res) => {
  try {
    const curriculumId = toObjectId(req.params.curriculumId);
    if (!curriculumId) return res.status(400).json({ error: 'Invalid curriculumId' });

    const doc = await Curriculum.findById(
      curriculumId,
      { photos: 1, isPublic: 1, professionalId: 1 }
    );
    if (!doc) return res.status(404).json({ error: 'Curriculum not found' });

    // TODO: authorization check if !doc.isPublic
    res.json({ photos: doc.photos });
  } catch (err) {
    res.status(500).json({ error: 'List failed', details: err.message });
  }
});

/**
 * GET /api/curricula/files/:fileId
 * Streams the binary file from GridFS with proper headers
 */
router.get('/files/:fileId', async (req, res) => {
  try {
    const fileId = toObjectId(req.params.fileId);
    if (!fileId) return res.status(400).json({ error: 'Invalid fileId' });

    const bucket = getGridFSBucket();
    const files = await mongoose.connection.db
      .collection('curriculum_photos.files')
      .find({ _id: fileId })
      .toArray();

    if (!files.length) return res.status(404).json({ error: 'File not found' });
    const file = files[0];

    // Optional: access control based on file.metadata.curriculumId
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    bucket.openDownloadStream(fileId)
      .on('error', () => res.status(404).end())
      .pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Stream failed', details: err.message });
  }
});

/**
 * DELETE /api/curricula/:curriculumId/photos/:fileId
 * Removes the photo from the model and deletes the GridFS file
 */
router.delete('/:curriculumId/photos/:fileId', async (req, res) => {
  try {
    const curriculumId = toObjectId(req.params.curriculumId);
    const fileId = toObjectId(req.params.fileId);
    if (!curriculumId || !fileId) return res.status(400).json({ error: 'Invalid IDs' });

    const doc = await Curriculum.findById(curriculumId);
    if (!doc) return res.status(404).json({ error: 'Curriculum not found' });

    // TODO: authorization (ensure owner)
    const exists = doc.photos.some((p) => String(p.fileId) === String(fileId));
    if (!exists) return res.status(404).json({ error: 'Photo does not belong to this curriculum' });

    // 1) Remove from document
    doc.photos = doc.photos.filter((p) => String(p.fileId) !== String(fileId));
    // If cover removed, pick a new one
    if (!doc.photos.some((p) => p.isMain) && doc.photos[0]) doc.photos[0].isMain = true;

    await doc.save();

    // 2) Delete from GridFS
    try {
      const bucket = getGridFSBucket();
      await bucket.delete(fileId);
    } catch (e) {
      console.error('Warning: GridFS delete failed after doc update', e);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;
