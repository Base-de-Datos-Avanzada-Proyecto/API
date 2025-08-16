/**
 * Job Offer GraphQL Type Definitions
 * ITI-821 Advanced Database Course
 * 
 * Defines GraphQL schema for job offer operations (vacant positions)
 */

const { gql } = require('apollo-server-express');

const jobOfferTypeDefs = gql`
  # Job Offer type definition
  type JobOffer {
    id: ID!
    title: String!
    description: String!
    employerId: Employer!
    requiredProfessions: [Profession!]!
    workType: WorkType!
    workModality: WorkModality!
    location: JobLocation!
    salary: JobSalary
    requirements: [String!]!
    preferredSkills: [String!]!
    experienceRequired: Int!
    educationLevel: EducationLevel
    applicationDeadline: String!
    maxApplications: Int!
    isActive: Boolean!
    isFeatured: Boolean!
    status: JobOfferStatus!
    contactEmail: String
    contactPhone: String
    viewCount: Int!
    applicationCount: Int!
    publishedAt: String
    lastUpdated: String!
    createdAt: String!
    updatedAt: String!
    
    # Virtual fields
    isExpired: Boolean!
    daysUntilDeadline: Int!
    salaryRange: String!
    
    # Related data
    applications: [JobApplication!]!
    employer: Employer!
  }

  # Job Location type
  type JobLocation {
    canton: Canton!
    specificLocation: String
  }

  # Job Salary type
  type JobSalary {
    min: Float
    max: Float
    currency: Currency!
    isNegotiable: Boolean!
  }

  # Input types for creating and updating job offers
  input JobOfferInput {
    title: String!
    description: String!
    employerId: ID!
    requiredProfessions: [ID!]!
    workType: WorkType!
    workModality: WorkModality!
    location: JobLocationInput!
    salary: JobSalaryInput
    requirements: [String!]
    preferredSkills: [String!]
    experienceRequired: Int
    educationLevel: EducationLevel
    applicationDeadline: String!
    maxApplications: Int
    contactEmail: String
    contactPhone: String
    isFeatured: Boolean
  }

  input JobOfferUpdateInput {
    title: String
    description: String
    requiredProfessions: [ID!]
    workType: WorkType
    workModality: WorkModality
    location: JobLocationInput
    salary: JobSalaryInput
    requirements: [String!]
    preferredSkills: [String!]
    experienceRequired: Int
    educationLevel: EducationLevel
    applicationDeadline: String
    maxApplications: Int
    contactEmail: String
    contactPhone: String
    isActive: Boolean
    isFeatured: Boolean
    status: JobOfferStatus
  }

  input JobLocationInput {
    canton: Canton!
    specificLocation: String
  }

  input JobSalaryInput {
    min: Float
    max: Float
    currency: Currency
    isNegotiable: Boolean
  }

  # Enums
  enum WorkType {
    Full_time
    Part_time
    Contract
    Temporary
    Internship
  }

  enum WorkModality {
    On_site
    Remote
    Hybrid
  }

  enum EducationLevel {
    None
    High_School
    Technical
    Bachelor
    Master
    PhD
  }

  enum JobOfferStatus {
    Draft
    Published
    Paused
    Closed
    Filled
  }

  # Statistics types
  type JobOfferStats {
    total: Int!
    active: Int!
    published: Int!
    expired: Int!
  }

  type VacantPosition {
    id: ID!
    title: String!
    employer: String!
    canton: Canton!
    workType: WorkType!
    applicationDeadline: String!
    status: JobOfferStatus!
  }

  # Filter and search inputs
  input JobOfferFilter {
    employerId: ID
    requiredProfessions: [ID!]
    workType: WorkType
    workModality: WorkModality
    canton: Canton
    isActive: Boolean
    status: JobOfferStatus
    isFeatured: Boolean
    isExpired: Boolean
    salaryMin: Float
    salaryMax: Float
    experienceMax: Int
    educationLevel: EducationLevel
    searchText: String
  }

  input JobOfferSort {
    field: JobOfferSortField!
    order: SortOrder!
  }

  enum JobOfferSortField {
    title
    publishedAt
    applicationDeadline
    viewCount
    applicationCount
    createdAt
    salary
  }

  enum SortOrder {
    ASC
    DESC
  }

  # Queries
  type Query {
    # Get all job offers with optional filtering and sorting
    jobOffers(
      filter: JobOfferFilter
      sort: JobOfferSort
      limit: Int
      offset: Int
    ): [JobOffer!]!

    # Get job offer by ID
    jobOffer(id: ID!): JobOffer

    # Get job offers by employer
    jobOffersByEmployer(employerId: ID!): [JobOffer!]!

    # Get job offers by profession
    jobOffersByProfession(professionId: ID!): [JobOffer!]!

    # Get job offers by canton
    jobOffersByCanton(canton: Canton!): [JobOffer!]!

    # Get active job offers
    activeJobOffers: [JobOffer!]!

    # Get featured job offers
    featuredJobOffers(limit: Int = 10): [JobOffer!]!

    # Get job offer statistics
    jobOfferStats: JobOfferStats!

    # Get vacant positions inventory
    vacantPositions: [VacantPosition!]!

    # Get total job offers count
    jobOffersCount(filter: JobOfferFilter): Int!

    # Search job offers by text
    searchJobOffers(searchText: String!): [JobOffer!]!

    # Get expiring job offers (deadline within X days)
    expiringJobOffers(days: Int = 7): [JobOffer!]!

    # Get most viewed job offers
    mostViewedJobOffers(limit: Int = 10): [JobOffer!]!
  }

  # Mutations
  type Mutation {
    # Create new job offer
    createJobOffer(input: JobOfferInput!): JobOffer!

    # Update job offer
    updateJobOffer(id: ID!, input: JobOfferUpdateInput!): JobOffer!

    # Delete job offer (soft delete - set isActive to false)
    deleteJobOffer(id: ID!): Boolean!

    # Publish job offer
    publishJobOffer(id: ID!): JobOffer!

    # Pause job offer
    pauseJobOffer(id: ID!): JobOffer!

    # Close job offer
    closeJobOffer(id: ID!, filled: Boolean = false): JobOffer!

    # Reopen job offer
    reopenJobOffer(id: ID!): JobOffer!

    # Feature/unfeature job offer
    toggleJobOfferFeatured(id: ID!): JobOffer!

    # Increment job offer view count
    incrementJobOfferViews(id: ID!): JobOffer!

    # Bulk create job offers (for massive data loading)
    createJobOffers(input: [JobOfferInput!]!): [JobOffer!]!

    # Extend application deadline
    extendApplicationDeadline(id: ID!, newDeadline: String!): JobOffer!

    # Update job offer requirements
    updateJobOfferRequirements(
      id: ID!
      requirements: [String!]!
      preferredSkills: [String!]!
    ): JobOffer!

    # Clone job offer
    cloneJobOffer(id: ID!, title: String!): JobOffer!
  }

  # Subscriptions (for future real-time features)
  type Subscription {
    # Subscribe to new job offers
    jobOfferCreated: JobOffer!

    # Subscribe to job offer updates
    jobOfferUpdated(id: ID!): JobOffer!

    # Subscribe to job offer status changes
    jobOfferStatusChanged(employerId: ID): JobOffer!
  }
`;

module.exports = jobOfferTypeDefs;