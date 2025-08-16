/**
 * Profession GraphQL Type Definitions
 * ITI-821 Advanced Database Course
 * 
 * Defines GraphQL schema for profession catalog operations
 */

const { gql } = require('apollo-server-express');

const professionTypeDefs = gql`
  # Profession type definition
  type Profession {
    id: ID!
    name: String!
    code: String!
    category: ProfessionCategory!
    subcategory: String
    description: String!
    requirements: [String!]!
    skills: [String!]!
    averageSalaryRange: SalaryRange
    isActive: Boolean!
    demandLevel: DemandLevel!
    registeredProfessionals: Int!
    activeJobOffers: Int!
    createdBy: String!
    lastUpdated: String!
    createdAt: String!
    updatedAt: String!
    
    # Virtual fields
    professionalCount: Int!
    jobOfferCount: Int!
    popularity: Int!
  }

  # Salary range for professions
  type SalaryRange {
    min: Float
    max: Float
    currency: Currency!
  }

  # Input types for creating and updating professions
  input ProfessionInput {
    name: String!
    code: String
    category: ProfessionCategory!
    subcategory: String
    description: String!
    requirements: [String!]
    skills: [String!]
    averageSalaryRange: SalaryRangeInput
    demandLevel: DemandLevel
    isActive: Boolean
  }

  input ProfessionUpdateInput {
    name: String
    code: String
    category: ProfessionCategory
    subcategory: String
    description: String
    requirements: [String!]
    skills: [String!]
    averageSalaryRange: SalaryRangeInput
    demandLevel: DemandLevel
    isActive: Boolean
  }

  input SalaryRangeInput {
    min: Float
    max: Float
    currency: Currency
  }

  # Enums
  enum ProfessionCategory {
    Technology
    Healthcare
    Education
    Engineering
    Business
    Arts
    Services
    Construction
    Agriculture
    Transportation
    Other
  }

  enum DemandLevel {
    Low
    Medium
    High
    Critical
  }

  enum Currency {
    CRC
    USD
  }

  # Statistics type
  type ProfessionCategoryStats {
    category: ProfessionCategory!
    count: Int!
    totalProfessionals: Int!
    totalJobOffers: Int!
    averageSalaryMin: Float
    averageSalaryMax: Float
  }

  # Filter and search inputs
  input ProfessionFilter {
    category: ProfessionCategory
    demandLevel: DemandLevel
    isActive: Boolean
    searchText: String
  }

  input ProfessionSort {
    field: ProfessionSortField!
    order: SortOrder!
  }

  enum ProfessionSortField {
    name
    category
    registeredProfessionals
    activeJobOffers
    popularity
    createdAt
  }

  enum SortOrder {
    ASC
    DESC
  }

  # Queries
  type Query {
    # Get all professions with optional filtering and sorting
    professions(
      filter: ProfessionFilter
      sort: ProfessionSort
      limit: Int
      offset: Int
    ): [Profession!]!

    # Get profession by ID
    profession(id: ID!): Profession

    # Get profession by code
    professionByCode(code: String!): Profession

    # Get professions by category
    professionsByCategory(category: ProfessionCategory!): [Profession!]!

    # Get most popular professions
    popularProfessions(limit: Int = 10): [Profession!]!

    # Get professions by demand level
    professionsByDemand(demandLevel: DemandLevel!): [Profession!]!

    # Search professions by text
    searchProfessions(searchText: String!): [Profession!]!

    # Get profession statistics by category
    professionStatsByCategory: [ProfessionCategoryStats!]!

    # Get total professions count
    professionsCount(filter: ProfessionFilter): Int!
  }

  # Mutations
  type Mutation {
    # Create new profession
    createProfession(input: ProfessionInput!): Profession!

    # Update profession
    updateProfession(id: ID!, input: ProfessionUpdateInput!): Profession!

    # Delete profession (soft delete - set isActive to false)
    deleteProfession(id: ID!): Boolean!

    # Add requirement to profession
    addProfessionRequirement(id: ID!, requirement: String!): Profession!

    # Remove requirement from profession
    removeProfessionRequirement(id: ID!, requirement: String!): Profession!

    # Add skill to profession
    addProfessionSkill(id: ID!, skill: String!): Profession!

    # Remove skill from profession
    removeProfessionSkill(id: ID!, skill: String!): Profession!

    # Update profession statistics
    updateProfessionStats(id: ID!): Profession!

    # Bulk update all profession statistics
    updateAllProfessionStats: [Profession!]!

    # Toggle profession active status
    toggleProfessionStatus(id: ID!): Profession!
  }
`;

module.exports = professionTypeDefs;