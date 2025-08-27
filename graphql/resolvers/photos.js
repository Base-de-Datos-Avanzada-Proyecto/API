// graphql/resolvers/photos.js
module.exports = {
  Curriculum: {
    photos: (doc) => doc.photos || [],
    mainPhotoUrl: (doc) => {
      const list = doc.photos || [];
      const main = list.find(p => p.isMain) || list[0];
      return main ? `/api/curricula/files/${main.fileId}` : '';
    },
  },
  Photo: {
    url: (p) => `/api/curricula/files/${p.fileId}`,
  },
};
