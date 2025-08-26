// graphql/typeDefs/photos.js
const { gql } = require('apollo-server-express');

module.exports = gql`
  type Photo {
    fileId: ID!
    filename: String
    contentType: String
    length: Int
    uploadDate: String
    caption: String
    isMain: Boolean
    url: String!  # /api/curricula/files/:fileId
  }

  extend type Curriculum {
    photos: [Photo!]!
    mainPhotoUrl: String!  # portada o vacío
  }
`;
