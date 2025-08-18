/**
 * Curriculum GraphQL Type Definitions
 * ITI-821 Advanced Database Course
 * 
 * Defines GraphQL schema for curriculum operations
 * Works with Curriculum model for digital resume management
 */

const { gql } = require('apollo-server-express');

const curriculumTypeDefs = gql`
  # Main Curriculum type definition
  type Curriculum {
    id: ID!
    professionalId: ID!
    professions: [CurriculumProfession!]!
    education: [Education!]!
    workExperience: [WorkExperience!]!
    certifications: [Certification!]!
    skills: [Skill!]!
    languages: [Language!]!
    summary: String
    objectives: String
    portfolio: Portfolio
    references: [Reference!]!
    isComplete: Boolean!
    isPublic: Boolean!
    lastReviewed: String
    version: Int!
    createdAt: String!
    updatedAt: String!
    
    # Virtual fields
    totalWorkExperience: Float!
    highestEducation: String!
    
    # Related data
    professional: Professional!
  }

  # Profession association within curriculum
  type CurriculumProfession {
    professionId: Profession!
    registrationDate: String!
    experienceYears: Int!
    proficiencyLevel: ProficiencyLevel!
  }

  # Education entry
  type Education {
    id: ID
    institution: String!
    degree: String!
    fieldOfStudy: String
    educationLevel: EducationLevel!
    startDate: String!
    endDate: String
    isCompleted: Boolean!
    gpa: Float
    description: String
  }

  # Work experience entry
  type WorkExperience {
    id: ID
    company: String!
    position: String!
    startDate: String!
    endDate: String
    isCurrentJob: Boolean!
    description: String
    achievements: [String!]!
    skills: [String!]!
    salary: Salary
  }

  # Salary information
  type Salary {
    amount: Float
    currency: Currency!
  }

  # Certification entry
  type Certification {
    id: ID
    name: String!
    issuingOrganization: String!
    issueDate: String!
    expirationDate: String
    credentialId: String
    credentialUrl: String
    isActive: Boolean!
  }

  # Skill entry
  type Skill {
    name: String!
    category: SkillCategory!
    proficiencyLevel: ProficiencyLevel!
    yearsOfExperience: Int!
  }

  # Language entry
  type Language {
    language: String!
    proficiency: LanguageProficiency!
    certified: Boolean!
  }

  # Portfolio information
  type Portfolio {
    website: String
    linkedin: String
    github: String
    other: [PortfolioLink!]!
  }

  # Portfolio link
  type PortfolioLink {
    platform: String!
    url: String!
  }

  # Reference entry
  type Reference {
    name: String!
    position: String
    company: String
    email: String
    phone: String
    relationship: ReferenceRelationship
  }

  # Statistics types
  type CurriculumProfessionStats {
    profession: Profession!
    count: Int!
    avgExperience: Float!
    proficiencyLevels: [ProficiencyLevel!]!
  }

  type CurriculumEducationStats {
    educationLevel: EducationLevel!
    count: Int!
    percentage: Float!
  }

  type CurriculumSkillStats {
    category: SkillCategory!
    count: Int!
    avgYears: Float!
  }

  # Enums
  enum ProficiencyLevel {
    Beginner
    Intermediate
    Advanced
    Expert
  }

  enum EducationLevel {
    HighSchool
    Technical
    Associate
    Bachelor
    Master
    PhD
    Other
  }

  enum SkillCategory {
    Technical
    Soft
    Language
    Tool
    Framework
    Other
  }

  enum LanguageProficiency {
    Basic
    Conversational
    Fluent
    Native
  }

  enum Currency {
    CRC
    USD
  }

  enum ReferenceRelationship {
    Supervisor
    Colleague
    Client
    Professor
    Other
  }

  # Input types for creating curriculum
  input CurriculumInput {
    professionalId: ID!
    professions: [CurriculumProfessionInput!]!
    education: [EducationInput!]
    workExperience: [WorkExperienceInput!]
    certifications: [CertificationInput!]
    skills: [SkillInput!]
    languages: [LanguageInput!]
    summary: String
    objectives: String
    portfolio: PortfolioInput
    references: [ReferenceInput!]
    isPublic: Boolean
  }

  # Input types for updating curriculum
  input CurriculumUpdateInput {
    professions: [CurriculumProfessionInput!]
    education: [EducationInput!]
    workExperience: [WorkExperienceInput!]
    certifications: [CertificationInput!]
    skills: [SkillInput!]
    languages: [LanguageInput!]
    summary: String
    objectives: String
    portfolio: PortfolioInput
    references: [ReferenceInput!]
    isPublic: Boolean
  }

  # Nested input types
  input CurriculumProfessionInput {
    professionId: ID!
    experienceYears: Int
    proficiencyLevel: ProficiencyLevel
  }

  input EducationInput {
    institution: String!
    degree: String!
    fieldOfStudy: String
    educationLevel: EducationLevel!
    startDate: String!
    endDate: String
    isCompleted: Boolean
    gpa: Float
    description: String
  }

  input WorkExperienceInput {
    company: String!
    position: String!
    startDate: String!
    endDate: String
    isCurrentJob: Boolean
    description: String
    achievements: [String!]
    skills: [String!]
    salary: SalaryInput
  }

  input SalaryInput {
    amount: Float
    currency: Currency
  }

  input CertificationInput {
    name: String!
    issuingOrganization: String!
    issueDate: String!
    expirationDate: String
    credentialId: String
    credentialUrl: String
    isActive: Boolean
  }

  input SkillInput {
    name: String!
    category: SkillCategory
    proficiencyLevel: ProficiencyLevel
    yearsOfExperience: Int
  }

  input LanguageInput {
    language: String!
    proficiency: LanguageProficiency!
    certified: Boolean
  }

  input PortfolioInput {
    website: String
    linkedin: String
    github: String
    other: [PortfolioLinkInput!]
  }

  input PortfolioLinkInput {
    platform: String!
    url: String!
  }

  input ReferenceInput {
    name: String!
    position: String
    company: String
    email: String
    phone: String
    relationship: ReferenceRelationship
  }

  # Filter and search inputs
  input CurriculumFilter {
    professionalId: ID
    professionId: ID
    educationLevel: EducationLevel
    skillCategory: SkillCategory
    isComplete: Boolean
    isPublic: Boolean
    hasWorkExperience: Boolean
    minExperienceYears: Int
    maxExperienceYears: Int
    searchText: String
  }

  input CurriculumSort {
    field: CurriculumSortField!
    order: SortOrder!
  }

  enum CurriculumSortField {
    updatedAt
    createdAt
    totalWorkExperience
    highestEducation
    version
  }

  # Extend Query type instead of defining new one
  extend type Query {
    # Get all curricula with optional filtering and sorting
    curricula(
      filter: CurriculumFilter
      sort: CurriculumSort
      limit: Int
      offset: Int
    ): [Curriculum!]!

    # Get curriculum by ID
    curriculum(id: ID!): Curriculum

    # Get curriculum by professional ID
    curriculumByProfessional(professionalId: ID!): Curriculum

    # Get curricula by profession
    curriculaByProfession(professionId: ID!): [Curriculum!]!

    # Get curricula by education level
    curriculaByEducationLevel(educationLevel: EducationLevel!): [Curriculum!]!

    # Get curricula by skill category
    curriculaBySkillCategory(category: SkillCategory!): [Curriculum!]!

    # Get completed curricula
    completedCurricula: [Curriculum!]!

    # Get public curricula
    publicCurricula: [Curriculum!]!

    # Search curricula by text
    searchCurricula(searchText: String!): [Curriculum!]!

    # Get curricula statistics by profession
    curriculaProfessionStats: [CurriculumProfessionStats!]!

    # Get curricula statistics by education level
    curriculaEducationStats: [CurriculumEducationStats!]!

    # Get curricula statistics by skill category
    curriculaSkillStats: [CurriculumSkillStats!]!

    # Get total curricula count
    curriculaCount(filter: CurriculumFilter): Int!

    # Get curricula by experience range
    curriculaByExperienceRange(minYears: Int!, maxYears: Int!): [Curriculum!]!

    # Get recently updated curricula
    recentlyUpdatedCurricula(limit: Int): [Curriculum!]!

    # Get curricula requiring review
    curriculaRequiringReview: [Curriculum!]!
  }

  # Extend Mutation type instead of defining new one
  extend type Mutation {
    # Create new curriculum
    createCurriculum(input: CurriculumInput!): Curriculum!

    # Update curriculum
    updateCurriculum(id: ID!, input: CurriculumUpdateInput!): Curriculum!

    # Delete curriculum (soft delete)
    deleteCurriculum(id: ID!): Boolean!

    # Add profession to curriculum
    addProfessionToCurriculum(
      id: ID!
      professionId: ID!
      experienceYears: Int
      proficiencyLevel: ProficiencyLevel
    ): Curriculum!

    # Remove profession from curriculum
    removeProfessionFromCurriculum(id: ID!, professionId: ID!): Curriculum!

    # Add education entry
    addEducationEntry(id: ID!, education: EducationInput!): Curriculum!

    # Update education entry
    updateEducationEntry(id: ID!, educationId: String!, education: EducationInput!): Curriculum!

    # Remove education entry
    removeEducationEntry(id: ID!, educationId: String!): Curriculum!

    # Add work experience entry
    addWorkExperienceEntry(id: ID!, experience: WorkExperienceInput!): Curriculum!

    # Update work experience entry
    updateWorkExperienceEntry(id: ID!, experienceId: String!, experience: WorkExperienceInput!): Curriculum!

    # Remove work experience entry
    removeWorkExperienceEntry(id: ID!, experienceId: String!): Curriculum!

    # Add certification
    addCertification(id: ID!, certification: CertificationInput!): Curriculum!

    # Update certification
    updateCertification(id: ID!, certificationId: String!, certification: CertificationInput!): Curriculum!

    # Remove certification
    removeCertification(id: ID!, certificationId: String!): Curriculum!

    # Add skill
    addSkill(id: ID!, skill: SkillInput!): Curriculum!

    # Update skill
    updateSkill(id: ID!, skillName: String!, skill: SkillInput!): Curriculum!

    # Remove skill
    removeSkill(id: ID!, skillName: String!): Curriculum!

    # Add language
    addLanguage(id: ID!, language: LanguageInput!): Curriculum!

    # Update language
    updateLanguage(id: ID!, languageName: String!, language: LanguageInput!): Curriculum!

    # Remove language
    removeLanguage(id: ID!, languageName: String!): Curriculum!

    # Update portfolio
    updatePortfolio(id: ID!, portfolio: PortfolioInput!): Curriculum!

    # Add reference
    addReference(id: ID!, reference: ReferenceInput!): Curriculum!

    # Update reference
    updateReference(id: ID!, referenceId: String!, reference: ReferenceInput!): Curriculum!

    # Remove reference
    removeReference(id: ID!, referenceId: String!): Curriculum!

    # Mark curriculum as complete
    markCurriculumAsComplete(id: ID!): Curriculum!

    # Toggle curriculum visibility
    toggleCurriculumVisibility(id: ID!): Curriculum!

    # Update curriculum summary and objectives
    updateCurriculumSummary(id: ID!, summary: String, objectives: String): Curriculum!

    # Review curriculum (update lastReviewed date)
    reviewCurriculum(id: ID!): Curriculum!
  }

  # Extend Subscription type instead of defining new one
  extend type Subscription {
    # Subscribe to curriculum updates
    curriculumUpdated(id: ID!): Curriculum!

    # Subscribe to new curricula
    curriculumCreated: Curriculum!

    # Subscribe to curriculum completions
    curriculumCompleted: Curriculum!
  }
`;

module.exports = curriculumTypeDefs;