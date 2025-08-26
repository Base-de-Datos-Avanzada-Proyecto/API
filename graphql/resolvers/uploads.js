// graphql/resolvers/uploads.js
const mongoose = require('mongoose');
const { Types, connection } = mongoose;
const { pipeline } = require('stream/promises');
const path = require('path');
const crypto = require('crypto');

const Curriculum = require('../../models/Curriculum');
const { getGridFSBucket } = require('../../gridfs/bucket');
const { GraphQLUpload } = require('graphql-upload');

module.exports = {
  Upload: GraphQLUpload,

  Mutation: {
    async uploadCurriculumPhoto(_, { curriculumId, file, caption }) {
      const doc = await Curriculum.findById(curriculumId);
      if (!doc) throw new Error('Curriculum not found');

      const { createReadStream, filename, mimetype } = await file;
      if (!/^image\/(jpe?g|png|webp|gif)$/i.test(mimetype)) {
        throw new Error('Images only (jpg, png, webp, gif)');
      }

      const bucket = getGridFSBucket();
      const ext = path.extname(filename) || '';
      const safeName = crypto.randomBytes(12).toString('hex') + ext;

      const uploadStream = bucket.openUploadStream(safeName, {
        contentType: mimetype,
        metadata: {
          curriculumId: String(doc._id),
          professionalId: doc.professionalId ? String(doc.professionalId) : null,
        },
      });

      await pipeline(createReadStream(), uploadStream);

      const fileDoc = await connection.db
        .collection('curriculum_photos.files')
        .findOne({ _id: uploadStream.id });

      const photoMeta = {
        fileId: fileDoc._id,
        filename: fileDoc.filename,
        contentType: fileDoc.contentType,
        length: fileDoc.length,
        uploadDate: fileDoc.uploadDate,
        caption: caption || '',
        isMain: (doc.photos || []).length === 0,
      };

      await Curriculum.updateOne({ _id: doc._id }, { $addToSet: { photos: photoMeta } });
      return { ...photoMeta }; // Photo.url se resuelve en Photo.url
    },

    async deleteCurriculumPhoto(_, { curriculumId, fileId }) {
      const cid = Types.ObjectId.isValid(curriculumId) ? new Types.ObjectId(curriculumId) : null;
      const fid = Types.ObjectId.isValid(fileId) ? new Types.ObjectId(fileId) : null;
      if (!cid || !fid) throw new Error('Invalid ids');

      const doc = await Curriculum.findById(cid);
      if (!doc) throw new Error('Curriculum not found');

      const owned = (doc.photos || []).some((p) => String(p.fileId) === String(fid));
      if (!owned) throw new Error('Photo does not belong to this curriculum');

      // 1) Actualiza el documento
      doc.photos = (doc.photos || []).filter((p) => String(p.fileId) !== String(fid));
      if (!doc.photos.some((p) => p.isMain) && doc.photos[0]) doc.photos[0].isMain = true;
      await doc.save();

      // 2) Borra en GridFS (best-effort)
      try {
        const bucket = getGridFSBucket();
        await bucket.delete(fid);
      } catch (e) {
        console.error('Warning: GridFS delete failed', e);
      }
      return true;
    },

    async setCurriculumMainPhoto(_, { curriculumId, fileId }) {
      const cid = Types.ObjectId.isValid(curriculumId) ? new Types.ObjectId(curriculumId) : null;
      const fid = Types.ObjectId.isValid(fileId) ? new Types.ObjectId(fileId) : null;
      if (!cid || !fid) throw new Error('Invalid ids');

      const doc = await Curriculum.findById(cid);
      if (!doc) throw new Error('Curriculum not found');

      let found = false;
      doc.photos = (doc.photos || []).map((p) => {
        const isTarget = String(p.fileId) === String(fid);
        if (isTarget) found = true;
        const base = typeof p.toObject === 'function' ? p.toObject() : p;
        return { ...base, isMain: isTarget };
      });
      if (!found) throw new Error('Photo not found in this curriculum');

      await doc.save();
      return true;
    },
  },
};
