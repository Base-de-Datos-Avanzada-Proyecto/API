const { mergeTypeDefs } = require('@graphql-tools/merge');
const { mergeResolvers } = require('@graphql-tools/merge');

// Importar typedefs
const professionalTypeDefs = require('./typeDefs/professionalTypeDefs');
const employerTypeDefs = require('./typeDefs/employerTypeDefs');
const professionTypeDefs = require('./typeDefs/professionTypeDefs');
const jobOfferTypeDefs = require('./typeDefs/jobOfferTypeDefs');
const applicationTypeDefs  = require('./typeDefs/applicationTypeDefs');
const curriculumTypeDefs  = require('./typeDefs/curriculumTypeDefs');
const photosTypeDefs = require('./typeDefs/photos');
const uploadsTypeDefs = require('./typeDefs/uploads');

// Importar resolvers
const professionalResolvers = require('./resolvers/professionalResolvers');
const employerResolvers = require('./resolvers/employerResolvers');
const professionResolvers = require('./resolvers/professionResolvers');
const jobOfferResolvers = require('./resolvers/jobOfferResolver');
const applicationResolvers  = require('./resolvers/applicationResolvers');
const curriculumResolvers  = require('./resolvers/curriculumResolvers');
const photosResolvers = require('./resolvers/photos');
const uploadsResolvers = require('./resolvers/uploads');

// Fusionar typedefs y resolvers
const typeDefs = mergeTypeDefs([
  professionalTypeDefs,
  employerTypeDefs,
  professionTypeDefs,
  jobOfferTypeDefs,
  applicationTypeDefs,
  curriculumTypeDefs,
  photosTypeDefs,   
  uploadsTypeDefs  
]);

const resolvers = mergeResolvers([
  professionalResolvers,
  employerResolvers,
  professionResolvers,
  jobOfferResolvers,
  applicationResolvers,
  curriculumResolvers,
  photosResolvers, 
  uploadsResolvers 
]);

module.exports = { typeDefs, resolvers };
