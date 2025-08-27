// graphql/typeDefs/uploads.js
const { gql } = require('apollo-server-express');

module.exports = gql`
  scalar Upload

  extend type Mutation {
    uploadCurriculumPhoto(curriculumId: ID!, file: Upload!, caption: String): Photo!
    deleteCurriculumPhoto(curriculumId: ID!, fileId: ID!): Boolean!
    setCurriculumMainPhoto(curriculumId: ID!, fileId: ID!): Boolean!
  }
`;
