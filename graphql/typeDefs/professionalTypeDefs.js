/**
 * Professional GraphQL Type Definitions
 * ITI-821 Advanced Database Course
 * 
 * Defines GraphQL schema for professional operations
 */

const { gql } = require('apollo-server-express');

const professionalTypeDefs = gql`
  # Professional type definition
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
    professions: [ProfessionalProfession!]!
    isActive: Boolean!
    registrationDate: String!
    lastUpdated: String!
    createdAt: String!
    updatedAt: String!
    
    # Virtual fields
    fullName: String!
    age: Int
    
    # Related data
    activeProfessions: [Profession!]!
    applications: [JobApplication!]!
    monthlyApplicationsCount: Int!
  }

  # Professional profession association
  type ProfessionalProfession {
    professionId: Profession!
    registrationDate: String!
  }

  # Input for professional profession association
  input ProfessionalProfessionInput {
    professionId: ID!
  }

  # Input types for creating and updating professionals
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
    professions: [ProfessionalProfessionInput!]!
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

    # Get professionals by profession
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
    # Create new professional
    createProfessional(input: ProfessionalInput!): Professional!

    # Update professional
    updateProfessional(id: ID!, input: ProfessionalUpdateInput!): Professional!

    # Delete professional (soft delete - set isActive to false)
    deleteProfessional(id: ID!): Boolean!

    # Add profession to professional
    addProfessionToProfessional(professionalId: ID!, professionId: ID!): Professional!

    # Remove profession from professional
    removeProfessionFromProfessional(professionalId: ID!, professionId: ID!): Professional!

    # Toggle professional active status
    toggleProfessionalStatus(id: ID!): Professional!

    # Bulk create professionals (for massive data loading)
    createProfessionals(input: [ProfessionalInput!]!): [Professional!]!

    # Update professional contact information
    updateProfessionalContact(
      id: ID!
      email: String
      phone: String
      address: String
    ): Professional!

    # Validate professional monthly application limit
    validateMonthlyApplicationLimit(professionalId: ID!): Boolean!
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