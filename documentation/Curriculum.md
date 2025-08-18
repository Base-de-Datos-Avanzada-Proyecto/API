# Curriculum GraphQL API Documentation

## Descripción General

Este módulo maneja todas las operaciones relacionadas con currículums digitales (CVs) en el sistema. Proporciona funcionalidades completas para crear, actualizar y gestionar currículums profesionales con secciones detalladas como educación, experiencia laboral, habilidades, certificaciones y más.

## Tipos de Datos

### Curriculum

```graphql
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

  # Campos virtuales
  totalWorkExperience: Float!
  highestEducation: String!

  # Datos relacionados
  professional: Professional!
}
```

### Enums Principales

- `EducationLevel`: HighSchool, Technical, Associate, Bachelor, Master, PhD, Other
- `ProficiencyLevel`: Beginner, Intermediate, Advanced, Expert
- `SkillCategory`: Technical, Soft, Language, Tool, Framework, Other
- `LanguageProficiency`: Basic, Conversational, Fluent, Native
- `Currency`: CRC, USD

---

## Queries

### 1. curricula

Obtiene todos los currículums con filtros avanzados y paginación.

**Sintaxis:**

```graphql
curricula(
  filter: CurriculumFilter
  sort: CurriculumSort
  limit: Int
  offset: Int
): [Curriculum!]!
```

**Filtros disponibles:**

```graphql
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
```

**Ejemplo de uso:**

```graphql
query GetPublicCurricula {
  curricula(
    filter: {
      isPublic: true
      isComplete: true
      educationLevel: Bachelor
      minExperienceYears: 2
    }
    sort: { field: updatedAt, order: DESC }
    limit: 20
    offset: 0
  ) {
    id
    summary
    totalWorkExperience
    highestEducation
    professional {
      name
      lastName
      email
    }
    professions {
      professionId {
        name
      }
      experienceYears
    }
    skills {
      name
      category
      proficiencyLevel
    }
  }
}
```

### 2. curriculum

Obtiene un currículum específico por ID.

**Sintaxis:**

```graphql
curriculum(id: ID!): Curriculum
```

**Ejemplo de uso:**

```graphql
query GetCurriculum {
  curriculum(id: "64a7b8c9d0e1f2345678901a") {
    id
    summary
    objectives
    isComplete
    isPublic

    professional {
      name
      lastName
      email
      phone
    }

    professions {
      professionId {
        name
      }
      experienceYears
      proficiencyLevel
    }

    education {
      institution
      degree
      fieldOfStudy
      educationLevel
      startDate
      endDate
      isCompleted
    }

    workExperience {
      company
      position
      startDate
      endDate
      isCurrentJob
      description
      achievements
      skills
    }

    certifications {
      name
      issuingOrganization
      issueDate
      expirationDate
      isActive
    }

    skills {
      name
      category
      proficiencyLevel
      yearsOfExperience
    }

    languages {
      language
      proficiency
      certified
    }

    portfolio {
      website
      linkedin
      github
      other {
        platform
        url
      }
    }

    references {
      name
      position
      company
      email
      phone
      relationship
    }
  }
}
```

### 3. curriculumByProfessional

Obtiene el currículum de un profesional específico.

**Sintaxis:**

```graphql
curriculumByProfessional(professionalId: ID!): Curriculum
```

**Ejemplo de uso:**

```graphql
query GetProfessionalCurriculum {
  curriculumByProfessional(professionalId: "64a7b8c9d0e1f2345678901b") {
    id
    summary
    objectives
    isComplete
    isPublic
    version
    lastReviewed

    professions {
      professionId {
        name
      }
      experienceYears
    }

    skills {
      name
      category
      proficiencyLevel
    }
  }
}
```

### 4. curriculaByProfession

Obtiene currículums filtrados por profesión.

**Sintaxis:**

```graphql
curriculaByProfession(professionId: ID!): [Curriculum!]!
```

**Ejemplo de uso:**

```graphql
query GetCurriculaByProfession {
  curriculaByProfession(professionId: "64a7b8c9d0e1f2345678901c") {
    id
    summary
    totalWorkExperience
    professional {
      name
      lastName
    }
    professions {
      experienceYears
      proficiencyLevel
    }
  }
}
```

### 5. curriculaByEducationLevel

Obtiene currículums por nivel educativo.

**Sintaxis:**

```graphql
curriculaByEducationLevel(educationLevel: EducationLevel!): [Curriculum!]!
```

**Ejemplo de uso:**

```graphql
query GetMastersDegreeHolders {
  curriculaByEducationLevel(educationLevel: Master) {
    id
    professional {
      name
      lastName
      email
    }
    education {
      degree
      institution
      fieldOfStudy
    }
    totalWorkExperience
  }
}
```

### 6. curriculaBySkillCategory

Obtiene currículums por categoría de habilidad.

**Sintaxis:**

```graphql
curriculaBySkillCategory(category: SkillCategory!): [Curriculum!]!
```

**Ejemplo de uso:**

```graphql
query GetTechnicalProfessionals {
  curriculaBySkillCategory(category: Technical) {
    id
    professional {
      name
      lastName
    }
    skills(category: Technical) {
      name
      proficiencyLevel
      yearsOfExperience
    }
  }
}
```

### 7. completedCurricula

Obtiene todos los currículums completados.

**Sintaxis:**

```graphql
completedCurricula: [Curriculum!]!
```

**Ejemplo de uso:**

```graphql
query GetCompletedCurricula {
  completedCurricula {
    id
    professional {
      name
      lastName
    }
    summary
    totalWorkExperience
    updatedAt
  }
}
```

### 8. publicCurricula

Obtiene currículums públicos y completados.

**Sintaxis:**

```graphql
publicCurricula: [Curriculum!]!
```

**Ejemplo de uso:**

```graphql
query GetPublicCurricula {
  publicCurricula {
    id
    summary
    professional {
      name
      lastName
    }
    professions {
      professionId {
        name
      }
      experienceYears
    }
    skills {
      name
      category
      proficiencyLevel
    }
  }
}
```

### 9. searchCurricula

Busca currículums por texto en múltiples campos.

**Sintaxis:**

```graphql
searchCurricula(searchText: String!): [Curriculum!]!
```

**Ejemplo de uso:**

```graphql
query SearchCurricula {
  searchCurricula(searchText: "desarrollador software") {
    id
    summary
    objectives
    professional {
      name
      lastName
    }
    skills {
      name
      proficiencyLevel
    }
    workExperience {
      position
      company
    }
  }
}
```

### 10. curriculaProfessionStats

Obtiene estadísticas de currículums por profesión.

**Sintaxis:**

```graphql
curriculaProfessionStats: [CurriculumProfessionStats!]!
```

**Ejemplo de uso:**

```graphql
query GetProfessionStats {
  curriculaProfessionStats {
    profession {
      name
    }
    count
    avgExperience
    proficiencyLevels
  }
}
```

### 11. curriculaEducationStats

Obtiene estadísticas por nivel educativo.

**Sintaxis:**

```graphql
curriculaEducationStats: [CurriculumEducationStats!]!
```

**Ejemplo de uso:**

```graphql
query GetEducationStats {
  curriculaEducationStats {
    educationLevel
    count
    percentage
  }
}
```

### 12. curriculaSkillStats

Obtiene estadísticas por categorías de habilidades.

**Sintaxis:**

```graphql
curriculaSkillStats: [CurriculumSkillStats!]!
```

**Ejemplo de uso:**

```graphql
query GetSkillStats {
  curriculaSkillStats {
    category
    count
    avgYears
  }
}
```

### 13. curriculaCount

Cuenta currículums con filtros opcionales.

**Sintaxis:**

```graphql
curriculaCount(filter: CurriculumFilter): Int!
```

**Ejemplo de uso:**

```graphql
query CountPublicCurricula {
  curriculaCount(filter: { isPublic: true, isComplete: true })
}
```

### 14. curriculaByExperienceRange

Obtiene currículums por rango de experiencia.

**Sintaxis:**

```graphql
curriculaByExperienceRange(minYears: Int!, maxYears: Int!): [Curriculum!]!
```

**Ejemplo de uso:**

```graphql
query GetMidLevelProfessionals {
  curriculaByExperienceRange(minYears: 3, maxYears: 7) {
    id
    professional {
      name
      lastName
    }
    totalWorkExperience
    professions {
      experienceYears
    }
  }
}
```

### 15. recentlyUpdatedCurricula

Obtiene currículums actualizados recientemente.

**Sintaxis:**

```graphql
recentlyUpdatedCurricula(limit: Int): [Curriculum!]!
```

**Ejemplo de uso:**

```graphql
query GetRecentlyUpdated {
  recentlyUpdatedCurricula(limit: 10) {
    id
    professional {
      name
      lastName
    }
    updatedAt
    version
  }
}
```

### 16. curriculaRequiringReview

Obtiene currículums que requieren revisión.

**Sintaxis:**

```graphql
curriculaRequiringReview: [Curriculum!]!
```

**Ejemplo de uso:**

```graphql
query GetCurriculaNeedingReview {
  curriculaRequiringReview {
    id
    professional {
      name
      lastName
    }
    lastReviewed
    updatedAt
  }
}
```

---

## Mutations

### 1. createCurriculum

Crea un nuevo currículum.

**Sintaxis:**

```graphql
createCurriculum(input: CurriculumInput!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation CreateCurriculum {
  createCurriculum(
    input: {
      professionalId: "64a7b8c9d0e1f2345678901b"
      professions: [
        {
          professionId: "64a7b8c9d0e1f2345678901c"
          experienceYears: 5
          proficiencyLevel: Advanced
        }
      ]
      summary: "Desarrollador de software con 5 años de experiencia en tecnologías web modernas."
      objectives: "Busco crecer profesionalmente en el desarrollo de aplicaciones web y móviles."
      education: [
        {
          institution: "Universidad de Costa Rica"
          degree: "Ingeniería en Computación"
          fieldOfStudy: "Ciencias de la Computación"
          educationLevel: Bachelor
          startDate: "2015-01-01"
          endDate: "2019-12-31"
          isCompleted: true
          gpa: 3.8
        }
      ]
      skills: [
        {
          name: "JavaScript"
          category: Technical
          proficiencyLevel: Advanced
          yearsOfExperience: 5
        }
        {
          name: "React"
          category: Framework
          proficiencyLevel: Advanced
          yearsOfExperience: 4
        }
      ]
      languages: [
        { language: "Español", proficiency: Native, certified: false }
        { language: "Inglés", proficiency: Fluent, certified: true }
      ]
      isPublic: true
    }
  ) {
    id
    isComplete
    professional {
      name
      lastName
    }
  }
}
```

### 2. updateCurriculum

Actualiza un currículum existente.

**Sintaxis:**

```graphql
updateCurriculum(id: ID!, input: CurriculumUpdateInput!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation UpdateCurriculum {
  updateCurriculum(
    id: "64a7b8c9d0e1f2345678901a"
    input: {
      summary: "Desarrollador Full-Stack con experiencia en tecnologías modernas y metodologías ágiles."
      objectives: "Liderar equipos de desarrollo y arquitecturar soluciones escalables."
      isPublic: true
    }
  ) {
    id
    summary
    objectives
    isPublic
    updatedAt
  }
}
```

### 3. deleteCurriculum

Elimina un currículum (soft delete).

**Sintaxis:**

```graphql
deleteCurriculum(id: ID!): Boolean!
```

**Ejemplo de uso:**

```graphql
mutation DeleteCurriculum {
  deleteCurriculum(id: "64a7b8c9d0e1f2345678901a")
}
```

### 4. addProfessionToCurriculum

Agrega una profesión al currículum.

**Sintaxis:**

```graphql
addProfessionToCurriculum(
  id: ID!
  professionId: ID!
  experienceYears: Int
  proficiencyLevel: ProficiencyLevel
): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation AddProfession {
  addProfessionToCurriculum(
    id: "64a7b8c9d0e1f2345678901a"
    professionId: "64a7b8c9d0e1f2345678901c"
    experienceYears: 3
    proficiencyLevel: Intermediate
  ) {
    id
    professions {
      professionId {
        name
      }
      experienceYears
      proficiencyLevel
    }
  }
}
```

### 5. removeProfessionFromCurriculum

Remueve una profesión del currículum.

**Sintaxis:**

```graphql
removeProfessionFromCurriculum(id: ID!, professionId: ID!): Curriculum!
```

### 6. addEducationEntry

Agrega una entrada de educación.

**Sintaxis:**

```graphql
addEducationEntry(id: ID!, education: EducationInput!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation AddEducation {
  addEducationEntry(
    id: "64a7b8c9d0e1f2345678901a"
    education: {
      institution: "Universidad Nacional"
      degree: "Maestría en Administración de Empresas"
      fieldOfStudy: "Administración"
      educationLevel: Master
      startDate: "2020-01-01"
      endDate: "2022-12-31"
      isCompleted: true
      gpa: 3.9
      description: "Enfoque en gestión de proyectos tecnológicos"
    }
  ) {
    id
    education {
      institution
      degree
      educationLevel
      isCompleted
    }
  }
}
```

### 7. updateEducationEntry

Actualiza una entrada de educación.

**Sintaxis:**

```graphql
updateEducationEntry(id: ID!, educationId: String!, education: EducationInput!): Curriculum!
```

### 8. removeEducationEntry

Remueve una entrada de educación.

**Sintaxis:**

```graphql
removeEducationEntry(id: ID!, educationId: String!): Curriculum!
```

### 9. addWorkExperienceEntry

Agrega experiencia laboral.

**Sintaxis:**

```graphql
addWorkExperienceEntry(id: ID!, experience: WorkExperienceInput!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation AddWorkExperience {
  addWorkExperienceEntry(
    id: "64a7b8c9d0e1f2345678901a"
    experience: {
      company: "TechCorp S.A."
      position: "Desarrollador Senior"
      startDate: "2020-03-01"
      endDate: "2023-12-31"
      isCurrentJob: false
      description: "Desarrollo de aplicaciones web usando React y Node.js"
      achievements: [
        "Mejoró el rendimiento de la aplicación en un 40%"
        "Lideró equipo de 5 desarrolladores"
        "Implementó sistema de CI/CD"
      ]
      skills: ["React", "Node.js", "Docker", "AWS"]
      salary: { amount: 1500000, currency: CRC }
    }
  ) {
    id
    workExperience {
      company
      position
      isCurrentJob
      achievements
    }
    totalWorkExperience
  }
}
```

### 10. updateWorkExperienceEntry

Actualiza experiencia laboral.

**Sintaxis:**

```graphql
updateWorkExperienceEntry(id: ID!, experienceId: String!, experience: WorkExperienceInput!): Curriculum!
```

### 11. removeWorkExperienceEntry

Remueve experiencia laboral.

**Sintaxis:**

```graphql
removeWorkExperienceEntry(id: ID!, experienceId: String!): Curriculum!
```

### 12. addCertification

Agrega una certificación.

**Sintaxis:**

```graphql
addCertification(id: ID!, certification: CertificationInput!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation AddCertification {
  addCertification(
    id: "64a7b8c9d0e1f2345678901a"
    certification: {
      name: "AWS Certified Solutions Architect"
      issuingOrganization: "Amazon Web Services"
      issueDate: "2023-06-15"
      expirationDate: "2026-06-15"
      credentialId: "AWS-CSA-123456789"
      credentialUrl: "https://aws.amazon.com/verification"
      isActive: true
    }
  ) {
    id
    certifications {
      name
      issuingOrganization
      issueDate
      isActive
    }
  }
}
```

### 13. updateCertification

Actualiza una certificación.

**Sintaxis:**

```graphql
updateCertification(id: ID!, certificationId: String!, certification: CertificationInput!): Curriculum!
```

### 14. removeCertification

Remueve una certificación.

**Sintaxis:**

```graphql
removeCertification(id: ID!, certificationId: String!): Curriculum!
```

### 15. addSkill

Agrega una habilidad.

**Sintaxis:**

```graphql
addSkill(id: ID!, skill: SkillInput!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation AddSkill {
  addSkill(
    id: "64a7b8c9d0e1f2345678901a"
    skill: {
      name: "Python"
      category: Technical
      proficiencyLevel: Advanced
      yearsOfExperience: 4
    }
  ) {
    id
    skills {
      name
      category
      proficiencyLevel
      yearsOfExperience
    }
  }
}
```

### 16. updateSkill

Actualiza una habilidad.

**Sintaxis:**

```graphql
updateSkill(id: ID!, skillName: String!, skill: SkillInput!): Curriculum!
```

### 17. removeSkill

Remueve una habilidad.

**Sintaxis:**

```graphql
removeSkill(id: ID!, skillName: String!): Curriculum!
```

### 18. addLanguage

Agrega un idioma.

**Sintaxis:**

```graphql
addLanguage(id: ID!, language: LanguageInput!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation AddLanguage {
  addLanguage(
    id: "64a7b8c9d0e1f2345678901a"
    language: {
      language: "Francés"
      proficiency: Conversational
      certified: false
    }
  ) {
    id
    languages {
      language
      proficiency
      certified
    }
  }
}
```

### 19. updateLanguage

Actualiza un idioma.

**Sintaxis:**

```graphql
updateLanguage(id: ID!, languageName: String!, language: LanguageInput!): Curriculum!
```

### 20. removeLanguage

Remueve un idioma.

**Sintaxis:**

```graphql
removeLanguage(id: ID!, languageName: String!): Curriculum!
```

### 21. updatePortfolio

Actualiza el portafolio.

**Sintaxis:**

```graphql
updatePortfolio(id: ID!, portfolio: PortfolioInput!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation UpdatePortfolio {
  updatePortfolio(
    id: "64a7b8c9d0e1f2345678901a"
    portfolio: {
      website: "https://miportafolio.com"
      linkedin: "https://linkedin.com/in/miperfil"
      github: "https://github.com/miusuario"
      other: [
        { platform: "Behance", url: "https://behance.net/miperfil" }
        {
          platform: "Stack Overflow"
          url: "https://stackoverflow.com/users/123456"
        }
      ]
    }
  ) {
    id
    portfolio {
      website
      linkedin
      github
      other {
        platform
        url
      }
    }
  }
}
```

### 22. addReference

Agrega una referencia.

**Sintaxis:**

```graphql
addReference(id: ID!, reference: ReferenceInput!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation AddReference {
  addReference(
    id: "64a7b8c9d0e1f2345678901a"
    reference: {
      name: "Carlos Mendoza"
      position: "Director de Tecnología"
      company: "TechCorp S.A."
      email: "carlos.mendoza@techcorp.com"
      phone: "87654321"
      relationship: Supervisor
    }
  ) {
    id
    references {
      name
      position
      company
      relationship
    }
  }
}
```

### 23. updateReference

Actualiza una referencia.

**Sintaxis:**

```graphql
updateReference(id: ID!, referenceId: String!, reference: ReferenceInput!): Curriculum!
```

### 24. removeReference

Remueve una referencia.

**Sintaxis:**

```graphql
removeReference(id: ID!, referenceId: String!): Curriculum!
```

### 25. markCurriculumAsComplete

Marca el currículum como completado.

**Sintaxis:**

```graphql
markCurriculumAsComplete(id: ID!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation MarkAsComplete {
  markCurriculumAsComplete(id: "64a7b8c9d0e1f2345678901a") {
    id
    isComplete
    updatedAt
  }
}
```

### 26. toggleCurriculumVisibility

Cambia la visibilidad pública del currículum.

**Sintaxis:**

```graphql
toggleCurriculumVisibility(id: ID!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation ToggleVisibility {
  toggleCurriculumVisibility(id: "64a7b8c9d0e1f2345678901a") {
    id
    isPublic
    updatedAt
  }
}
```

### 27. updateCurriculumSummary

Actualiza resumen y objetivos.

**Sintaxis:**

```graphql
updateCurriculumSummary(id: ID!, summary: String, objectives: String): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation UpdateSummary {
  updateCurriculumSummary(
    id: "64a7b8c9d0e1f2345678901a"
    summary: "Desarrollador Full-Stack con 7 años de experiencia en tecnologías web modernas, especializado en React, Node.js y arquitecturas de microservicios."
    objectives: "Busco liderar equipos de desarrollo en proyectos desafiantes que utilicen las últimas tecnologías y mejores prácticas del desarrollo de software."
  ) {
    id
    summary
    objectives
    updatedAt
  }
}
```

### 28. reviewCurriculum

Actualiza la fecha de última revisión.

**Sintaxis:**

```graphql
reviewCurriculum(id: ID!): Curriculum!
```

**Ejemplo de uso:**

```graphql
mutation ReviewCurriculum {
  reviewCurriculum(id: "64a7b8c9d0e1f2345678901a") {
    id
    lastReviewed
    updatedAt
  }
}
```

---

## Casos de Uso Comunes

### 1. Creación completa de currículum

```graphql
mutation CreateCompleteCurriculum {
  createCurriculum(
    input: {
      professionalId: "64a7b8c9d0e1f2345678901b"
      professions: [
        {
          professionId: "64a7b8c9d0e1f2345678901c"
          experienceYears: 5
          proficiencyLevel: Advanced
        }
      ]
      summary: "Desarrollador Full-Stack especializado en tecnologías web modernas"
      objectives: "Liderar proyectos de desarrollo de software innovadores"
      education: [
        {
          institution: "Universidad de Costa Rica"
          degree: "Ingeniería en Computación"
          fieldOfStudy: "Ciencias de la Computación"
          educationLevel: Bachelor
          startDate: "2015-01-01"
          endDate: "2019-12-31"
          isCompleted: true
          gpa: 3.8
        }
      ]
      workExperience: [
        {
          company: "TechCorp S.A."
          position: "Desarrollador Senior"
          startDate: "2020-01-01"
          isCurrentJob: true
          description: "Desarrollo de aplicaciones web enterprise"
          achievements: [
            "Lideró equipo de 5 desarrolladores"
            "Implementó arquitectura de microservicios"
          ]
          skills: ["React", "Node.js", "MongoDB"]
        }
      ]
      skills: [
        {
          name: "JavaScript"
          category: Technical
          proficiencyLevel: Expert
          yearsOfExperience: 6
        }
        {
          name: "Liderazgo"
          category: Soft
          proficiencyLevel: Advanced
          yearsOfExperience: 3
        }
      ]
      languages: [
        { language: "Español", proficiency: Native, certified: false }
        { language: "Inglés", proficiency: Fluent, certified: true }
      ]
      portfolio: {
        website: "https://miportafolio.com"
        linkedin: "https://linkedin.com/in/miperfil"
        github: "https://github.com/miusuario"
      }
      references: [
        {
          name: "María González"
          position: "Gerente de Desarrollo"
          company: "TechCorp S.A."
          email: "maria.gonzalez@techcorp.com"
          relationship: Supervisor
        }
      ]
      isPublic: true
    }
  ) {
    id
    isComplete
    professional {
      name
      lastName
    }
  }
}
```

### 2. Búsqueda avanzada de talento

```graphql
query FindTalent {
  curricula(
    filter: {
      isPublic: true
      isComplete: true
      skillCategory: Technical
      minExperienceYears: 3
      maxExperienceYears: 8
      educationLevel: Bachelor
    }
    sort: { field: updatedAt, order: DESC }
    limit: 20
  ) {
    id
    summary
    totalWorkExperience
    highestEducation

    professional {
      name
      lastName
      email
    }

    skills(category: Technical) {
      name
      proficiencyLevel
      yearsOfExperience
    }

    workExperience {
      position
      company
      isCurrentJob
    }

    education {
      degree
      institution
      educationLevel
    }
  }
}
```

### 3. Dashboard de currículum personal

```graphql
query CurriculumDashboard($professionalId: ID!) {
  curriculumByProfessional(professionalId: $professionalId) {
    id
    summary
    objectives
    isComplete
    isPublic
    version
    lastReviewed
    totalWorkExperience
    highestEducation

    professions {
      professionId {
        name
      }
      experienceYears
      proficiencyLevel
    }

    skills {
      category
      name
      proficiencyLevel
    }

    education {
      educationLevel
      degree
      institution
    }

    workExperience {
      position
      company
      isCurrentJob
    }
  }

  curriculaSkillStats {
    category
    count
    avgYears
  }
}
```

### 4. Análisis de mercado laboral

```graphql
query MarketAnalysis {
  curriculaProfessionStats {
    profession {
      name
    }
    count
    avgExperience
    proficiencyLevels
  }

  curriculaEducationStats {
    educationLevel
    count
    percentage
  }

  curriculaSkillStats {
    category
    count
    avgYears
  }

  curriculaCount(filter: { isComplete: true })
  curriculaCount(filter: { isPublic: true })
}
```

---

## Subscriptions

### 1. curriculumUpdated

Se suscribe a actualizaciones de un currículum específico.

**Sintaxis:**

```graphql
subscription CurriculumUpdates($curriculumId: ID!) {
  curriculumUpdated(id: $curriculumId) {
    id
    version
    updatedAt
    isComplete
    isPublic
  }
}
```

### 2. curriculumCreated

Se suscribe a nuevos currículums creados.

**Sintaxis:**

```graphql
subscription NewCurricula {
  curriculumCreated {
    id
    professional {
      name
      lastName
    }
    createdAt
  }
}
```

### 3. curriculumCompleted

Se suscribe a currículums marcados como completados.

**Sintaxis:**

```graphql
subscription CompletedCurricula {
  curriculumCompleted {
    id
    professional {
      name
      lastName
    }
    isComplete
    completedAt: updatedAt
  }
}
```
