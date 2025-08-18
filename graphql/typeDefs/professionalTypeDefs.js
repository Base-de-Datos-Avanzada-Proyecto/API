/**
 * Professional GraphQL Type Definitions
 * ITI-821 Advanced Database Course
 * 
 * Defines GraphQL schema for professional operations
 * Updated to work with simplified Professional model and Curriculum model
 */

const { gql } = require('apollo-server-express');

const professionalTypeDefs = gql`
  # Professional type definition (simplified - basic profile only)
  type Professional {
    id: ID!
    cedula: String!
    firstName: String!
    lastName: String!
    email: String!
    phone: String!
    canton: Canton!
    address: String!
    birthDate: String!
    gender: Gender!
    isActive: Boolean!
    profileCompleted: Boolean!
    registrationDate: String!
    lastUpdated: String!
    createdAt: String!
    updatedAt: String!
    
    # Virtual fields
    fullName: String!
    age: Int
    
    # Related data through methods
    curriculum: Curriculum
    professions: [CurriculumProfession!]!
    hasCurriculum: Boolean!
    monthlyApplicationsCount: Int!
    applications: [JobApplication!]!
  }

  # Input types for creating and updating professionals (basic info only)
  input ProfessionalInput {
    cedula: String!
    firstName: String!
    lastName: String!
    email: String!
    phone: String!
    canton: Canton!
    address: String!
    birthDate: String!
    gender: Gender!
  }

  input ProfessionalUpdateInput {
    cedula: String
    firstName: String
    lastName: String
    email: String
    phone: String
    canton: Canton
    address: String
    birthDate: String
    gender: Gender
    isActive: Boolean
  }

  # Enums
  enum Gender {
    Male
    Female
    Other
  }

  # Statistics types
  type ProfessionalGenderStats {
    gender: Gender!
    count: Int!
  }

  type ProfessionalProfessionStats {
    profession: Profession!
    count: Int!
    percentage: Float!
  }

  type ProfessionalInfo {
    cedula: String!
    name: String!
    professions: [String!]!
  }

  type ApplicationLimitStatus {
    canApply: Boolean!
    remaining: Int!
    used: Int!
  }

  # Filter and search inputs
  input ProfessionalFilter {
    canton: Canton
    gender: Gender
    isActive: Boolean
    professionId: ID
    searchText: String
    ageMin: Int
    ageMax: Int
  }

  input ProfessionalSort {
    field: ProfessionalSortField!
    order: SortOrder!
  }

  enum ProfessionalSortField {
    firstName
    lastName
    registrationDate
    lastUpdated
    birthDate
    canton
  }

  enum SortOrder {
    ASC
    DESC
  }

  # Job Application type (for future implementation)
  type JobApplication {
    id: ID!
    professionalId: ID!
    jobOfferId: ID!
    applicationDate: String!
    status: ApplicationStatus!
  }

  enum ApplicationStatus {
    Pending
    Reviewed
    Accepted
    Rejected
    Withdrawn
  }

  # Queries
  type Query {
    # Get all professionals with optional filtering and sorting
    professionals(
      filter: ProfessionalFilter
      sort: ProfessionalSort
      limit: Int
      offset: Int
    ): [Professional!]!

    # Get professional by ID
    professional(id: ID!): Professional

    # Get professional by cedula
    professionalByCedula(cedula: String!): Professional

    # Get professionals by canton
    professionalsByCanton(canton: Canton!): [Professional!]!

    # Get professionals by profession (through curriculum)
    professionalsByProfession(professionId: ID!): [Professional!]!

    # Get professionals by gender
    professionalsByGender(gender: Gender!): [Professional!]!

    # Get professional gender statistics
    professionalGenderStats: [ProfessionalGenderStats!]!

    # Get professional statistics by profession area
    professionalProfessionStats: [ProfessionalProfessionStats!]!

    # Get total professionals count
    professionalsCount(filter: ProfessionalFilter): Int!

    # Get specific professional information for reports
    professionalInfo(cedula: String!): ProfessionalInfo

    # Search professionals by text
    searchProfessionals(searchText: String!): [Professional!]!

    # Get professionals by age range
    professionalsByAgeRange(minAge: Int!, maxAge: Int!): [Professional!]!
  }

  # Mutations
  type Mutation {
    # Create new professional (basic profile only)
    createProfessional(input: ProfessionalInput!): Professional!

    # Update professional basic information
    updateProfessional(id: ID!, input: ProfessionalUpdateInput!): Professional!

    # Delete professional (soft delete - set isActive to false)
    deleteProfessional(id: ID!): Boolean!

    # Toggle professional active status
    toggleProfessionalStatus(id: ID!): Professional!

    # Update professional contact information
    updateProfessionalContact(
      id: ID!
      email: String
      phone: String
      address: String
    ): Professional!

    # Mark professional profile as completed
    completeProfile(id: ID!): Professional!

    # Validate professional monthly application limit
    validateMonthlyApplicationLimit(professionalId: ID!): ApplicationLimitStatus!
  }

  # Subscriptions (for future real-time features)
  type Subscription {
    # Subscribe to new professional registrations
    professionalRegistered: Professional!

    # Subscribe to professional updates
    professionalUpdated(id: ID!): Professional!
  }
`;

module.exports = professionalTypeDefs;