const { mergeTypeDefs } = require('@graphql-tools/merge');
const { mergeResolvers } = require('@graphql-tools/merge');

// Importar typedefs
const professionalTypeDefs = require('./typeDefs/professionalTypeDefs');
const employerTypeDefs = require('./typeDefs/employerTypeDefs');
const professionTypeDefs = require('./typeDefs/professionTypeDefs');
const jobOfferTypeDefs = require('./typeDefs/jobOfferTypeDefs');
const applicationTypeDefs  = require('./typeDefs/applicationTypeDefs');

// Importar resolvers
const professionalResolvers = require('./resolvers/professionalResolvers');
const employerResolvers = require('./resolvers/employerResolvers');
const professionResolvers = require('./resolvers/professionResolvers');
const jobOfferResolvers = require('./resolvers/jobOfferResolver');
const applicationResolvers  = require('./resolvers/applicationResolvers');

// Fusionar typedefs y resolvers
const typeDefs = mergeTypeDefs([
  professionalTypeDefs,
  employerTypeDefs,
  professionTypeDefs,
  jobOfferTypeDefs,
  applicationTypeDefs
]);

const resolvers = mergeResolvers([
  professionalResolvers,
  employerResolvers,
  professionResolvers,
  jobOfferResolvers,
  applicationResolvers
]);

module.exports = { typeDefs, resolvers };
