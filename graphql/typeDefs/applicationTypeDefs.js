/**
 * Application GraphQL Type Definitions
 * ITI-821 Advanced Database Course
 * 
 * Defines GraphQL types, queries, and mutations for job applications
 */

const { gql } = require('apollo-server-express');

const applicationTypeDefs = gql`
  # Application Types
  type Application {
    id: ID!
    professionalId: ID!
    jobOfferId: ID!
    status: ApplicationStatus!
    coverLetter: String
    motivation: String
    expectedSalary: ExpectedSalary
    availabilityDate: String
    additionalSkills: [String!]
    appliedAt: String!
    reviewedAt: String
    reviewedBy: ID
    notes: String
    priority: Priority!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    
    # Virtual fields
    isReviewed: Boolean!
    daysSinceApplication: Int!
    expectedSalaryFormatted: String!
    
    # Relations
    professional: Professional
    jobOffer: JobOffer
    reviewer: Employer
  }

  type ExpectedSalary {
    amount: Float
    currency: Currency!
    isNegotiable: Boolean!
  }

  # Input Types
  input ApplicationInput {
    professionalId: ID!
    jobOfferId: ID!
    coverLetter: String
    motivation: String
    expectedSalary: ExpectedSalaryInput
    availabilityDate: String
    additionalSkills: [String!]
  }

  input ExpectedSalaryInput {
    amount: Float
    currency: Currency = CRC
    isNegotiable: Boolean = true
  }

  input ApplicationUpdateInput {
    coverLetter: String
    motivation: String
    expectedSalary: ExpectedSalaryInput
    availabilityDate: String
    additionalSkills: [String!]
  }

  input ReviewApplicationInput {
    status: ApplicationStatus!
    notes: String
    reviewerId: ID
  }

  input ApplicationFilters {
    status: ApplicationStatus
    priority: Priority
    professionalId: ID
    jobOfferId: ID
    startDate: String
    endDate: String
  }

  # Enums
  enum ApplicationStatus {
    Pending
    Accepted
    Rejected
  }

  enum Priority {
    Low
    Medium
    High
  }

  enum Currency {
    CRC
    USD
  }

  # Response Types
  type ApplicationResponse {
    success: Boolean!
    message: String!
    application: Application
    errors: [String!]
  }

  type ApplicationsResponse {
    success: Boolean!
    message: String!
    applications: [Application!]!
    totalCount: Int!
    errors: [String!]
  }

  type ApplicationStats {
    total: Int!
    pending: Int!
    accepted: Int!
    rejected: Int!
    avgDaysToReview: Float
  }

  type CanApplyResponse {
    canApply: Boolean!
    reason: String!
    monthlyCount: Int!
  }

  # Queries
  extend type Query {
    # Get single application
    application(id: ID!): ApplicationResponse!
    
    # Get applications with filters
    applications(
      filters: ApplicationFilters
      limit: Int = 10
      offset: Int = 0
      sortBy: String = "appliedAt"
      sortOrder: String = "desc"
    ): ApplicationsResponse!
    
    # Get applications by professional
    applicationsByProfessional(
      professionalId: ID!
      status: ApplicationStatus
      limit: Int = 10
      offset: Int = 0
    ): ApplicationsResponse!
    
    # Get applications by job offer
    applicationsByJobOffer(
      jobOfferId: ID!
      status: ApplicationStatus
      limit: Int = 10
      offset: Int = 0
    ): ApplicationsResponse!
    
    # Check if professional can apply to job
    canProfessionalApply(
      professionalId: ID!
      jobOfferId: ID!
    ): CanApplyResponse!
    
    # Get application statistics
    applicationStats: ApplicationStats!
    
    # Get professional's monthly application count
    monthlyApplicationCount(professionalId: ID!): Int!
  }

  # Mutations
  extend type Mutation {
    # Create new application
    createApplication(input: ApplicationInput!): ApplicationResponse!
    
    # Update application (only by professional, before review)
    updateApplication(
      id: ID!
      input: ApplicationUpdateInput!
    ): ApplicationResponse!
    
    # Review application (by employer)
    reviewApplication(
      id: ID!
      input: ReviewApplicationInput!
    ): ApplicationResponse!
    
    # Accept application (by employer)
    acceptApplication(
      id: ID!
      reviewerId: ID
      notes: String
    ): ApplicationResponse!
    
    # Reject application (by employer)
    rejectApplication(
      id: ID!
      reviewerId: ID
      reason: String
    ): ApplicationResponse!
    
    # Set application priority (by employer)
    setApplicationPriority(
      id: ID!
      priority: Priority!
    ): ApplicationResponse!
    
    # Delete application (soft delete)
    deleteApplication(id: ID!): ApplicationResponse!
  }
`;

module.exports = applicationTypeDefs;