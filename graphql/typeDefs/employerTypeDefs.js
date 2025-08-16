/**
 * Employer GraphQL Type Definitions
 * ITI-821 Advanced Database Course
 * 
 * Defines GraphQL schema for employer operations
 * Supports both individual persons (física) and legal entities (jurídica)
 */

const { gql } = require('apollo-server-express');

const employerTypeDefs = gql`
  # Employer type definition
  type Employer {
    id: ID!
    identification: String!
    employerType: EmployerType!
    name: String!
    lastName: String
    legalName: String
    businessSector: String
    email: String!
    phone: String!
    alternativePhone: String
    canton: Canton!
    address: String!
    website: String
    description: String
    expectedHires: Int
    preferredProfessions: [Profession!]!
    isVerified: Boolean!
    isActive: Boolean!
    registrationDate: String!
    lastUpdated: String!
    registrationNumber: String
    createdAt: String!
    updatedAt: String!
    
    # Virtual fields
    displayName: String!
    formattedIdentification: String!
    
    # Related data
    activeJobOffersCount: Int!
    jobOffers: [JobOffer!]!
  }

  # Input types for creating and updating employers
  input EmployerInput {
    identification: String!
    employerType: EmployerType!
    name: String!
    lastName: String
    legalName: String
    businessSector: String
    email: String!
    phone: String!
    alternativePhone: String
    canton: Canton!
    address: String!
    website: String
    description: String
    expectedHires: Int
    preferredProfessions: [ID!]
    registrationNumber: String
  }

  input EmployerUpdateInput {
    identification: String
    employerType: EmployerType
    name: String
    lastName: String
    legalName: String
    businessSector: String
    email: String
    phone: String
    alternativePhone: String
    canton: Canton
    address: String
    website: String
    description: String
    expectedHires: Int
    preferredProfessions: [ID!]
    isActive: Boolean
    registrationNumber: String
  }

  # Enums
  enum EmployerType {
    fisica
    juridica
  }

  enum Canton {
    Puntarenas
    Esparza
    MonteDeOro
  }

  # Statistics type
  type EmployerStats {
    total: Int!
    active: Int!
    verified: Int!
    fisica: Int!
    juridica: Int!
  }

  type EmployerInfo {
    cedula: String!
    name: String!
    jobOffers: [String!]!
  }

  # Filter and search inputs
  input EmployerFilter {
    employerType: EmployerType
    canton: Canton
    isVerified: Boolean
    isActive: Boolean
    businessSector: String
    searchText: String
  }

  input EmployerSort {
    field: EmployerSortField!
    order: SortOrder!
  }

  enum EmployerSortField {
    name
    registrationDate
    lastUpdated
    expectedHires
    businessSector
  }

  enum SortOrder {
    ASC
    DESC
  }

  # Queries
  type Query {
    # Get all employers with optional filtering and sorting
    employers(
      filter: EmployerFilter
      sort: EmployerSort
      limit: Int
      offset: Int
    ): [Employer!]!

    # Get employer by ID
    employer(id: ID!): Employer

    # Get employer by identification
    employerByIdentification(identification: String!): Employer

    # Get employers by type (física or jurídica)
    employersByType(type: EmployerType!): [Employer!]!

    # Get employers by canton
    employersByCanton(canton: Canton!): [Employer!]!

    # Get verified employers
    verifiedEmployers: [Employer!]!

    # Get employer statistics
    employerStats: EmployerStats!

    # Get total employers count
    employersCount(filter: EmployerFilter): Int!

    # Get general employer information for reports
    employersGeneralInfo: [EmployerInfo!]!

    # Search employers by text
    searchEmployers(searchText: String!): [Employer!]!
  }

  # Mutations
  type Mutation {
    # Create new employer
    createEmployer(input: EmployerInput!): Employer!

    # Update employer
    updateEmployer(id: ID!, input: EmployerUpdateInput!): Employer!

    # Delete employer (soft delete - set isActive to false)
    deleteEmployer(id: ID!): Boolean!

    # Add preferred profession to employer
    addPreferredProfession(employerId: ID!, professionId: ID!): Employer!

    # Remove preferred profession from employer
    removePreferredProfession(employerId: ID!, professionId: ID!): Employer!

    # Verify employer account
    verifyEmployer(id: ID!): Employer!

    # Toggle employer active status
    toggleEmployerStatus(id: ID!): Employer!

    # Bulk create employers (for massive data loading)
    createEmployers(input: [EmployerInput!]!): [Employer!]!

    # Update employer contact information
    updateEmployerContact(
      id: ID!
      email: String
      phone: String
      alternativePhone: String
      address: String
    ): Employer!
  }
`;

module.exports = employerTypeDefs;