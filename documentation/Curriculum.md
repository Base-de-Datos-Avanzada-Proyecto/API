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
      firstName
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
      firstName
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

**Ejemplo de uso:**

```graphql
query GetCurriculaByProfession {
  curriculaByProfession(professionId: "64a7b8c9d0e1f2345678901c") {
    id
    summary
    totalWorkExperience
    professional {
      firstName
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

**Ejemplo de uso:**

```graphql
query GetMastersDegreeHolders {
  curriculaByEducationLevel(educationLevel: Master) {
    id
    professional {
      firstName
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

**Ejemplo de uso:**

```graphql
query GetTechnicalProfessionals {
  curriculaBySkillCategory(category: Technical) {
    id
    professional {
      firstName
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

**Ejemplo de uso:**

```graphql
query GetCompletedCurricula {
  completedCurricula {
    id
    professional {
      firstName
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

**Ejemplo de uso:**

```graphql
query GetPublicCurricula {
  publicCurricula {
    id
    summary
    professional {
      firstName
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

**Ejemplo de uso:**

```graphql
query SearchCurricula {
  searchCurricula(searchText: "desarrollador software") {
    id
    summary
    objectives
    professional {
      firstName
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


### 10. curriculaEducationStats

Obtiene estadísticas por nivel educativo.

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

### 11. curriculaSkillStats

Obtiene estadísticas por categorías de habilidades.

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

### 12. curriculaCount

Cuenta currículums con filtros opcionales.

**Ejemplo de uso:**

```graphql
query CountPublicCurricula {
  curriculaCount(filter: { isPublic: true, isComplete: true })
}
```

### 13. curriculaByExperienceRange

Obtiene currículums por rango de experiencia.

**Ejemplo de uso:**

```graphql
query GetMidLevelProfessionals {
  curriculaByExperienceRange(minYears: 3, maxYears: 7) {
    id
    professional {
      firstName
      lastName
    }
    totalWorkExperience
    professions {
      experienceYears
    }
  }
}
```

### 14. recentlyUpdatedCurricula

Obtiene currículums actualizados recientemente.

**Ejemplo de uso:**

```graphql
query GetRecentlyUpdated {
  recentlyUpdatedCurricula(limit: 10) {
    id
    professional {
      firstName
      lastName
    }
    updatedAt
    version
  }
}
```

### 15. curriculaRequiringReview

Obtiene currículums que requieren revisión.

**Ejemplo de uso:**

```graphql
query GetCurriculaNeedingReview {
  curriculaRequiringReview {
    id
    professional {
      firstName
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

**Ejemplo de uso:**

```graphql
mutation CreateCurriculum {
  createCurriculum(
    input: {
      professionalId: "68a3d0b72582a71f10fc4ba8"
      professions: [
        {
          professionId: "68a3bee57357a7e08d784809"
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
      firstName
      lastName
    }
  }
}
```

### 2. updateCurriculum

Actualiza un currículum existente.

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

**Ejemplo de uso:**

```graphql
mutation DeleteCurriculum {
  deleteCurriculum(id: "64a7b8c9d0e1f2345678901a")
}
```

### 4. addProfessionToCurriculum

Agrega una profesión al currículum.

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

**Ejemplo de uso:**

```graphql
mutation RemoveProfessionFromCurriculum {
  removeProfessionFromCurriculum(
    id: "64a1b2c3d4e5f6789012345"
    professionId: "64a1b2c3d4e5f6789012999"
  ) {
    id
    professions {
      professionId {
        id
        name
      }
      experienceYears
      proficiencyLevel
      registrationDate
    }
    isComplete
    updatedAt
  }
}
```

### 6. addEducationEntry

Agrega una entrada de educación.

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

**Ejemplo de uso:**

```graphql
mutation UpdateEducationEntry {
  updateEducationEntry(
    id: "64a1b2c3d4e5f6789012345"
    educationId: "64a1b2c3d4e5f6789012111"
    education: {
      institution: "Universidad de Costa Rica"
      degree: "Licenciatura en Ingeniería en Computación"
      fieldOfStudy: "Ingeniería de Software"
      educationLevel: Bachelor
      startDate: "2018-03-01"
      endDate: "2022-12-15"
      isCompleted: true
      gpa: 9.2
      description: "Especialización en desarrollo de software y gestión de proyectos tecnológicos"
    }
  ) {
    id
    education {
      id
      institution
      degree
      fieldOfStudy
      educationLevel
      gpa
      isCompleted
    }
    updatedAt
  }
}
```

### 8. removeEducationEntry

Remueve una entrada de educación.

**Ejemplo de uso:**

```graphql
mutation RemoveEducationEntry {
  removeEducationEntry(
    id: "64a1b2c3d4e5f6789012345"
    educationId: "64a1b2c3d4e5f6789012222"
  ) {
    id
    education {
      id
      institution
      degree
      educationLevel
    }
    highestEducation
    updatedAt
  }
}
```

### 9. addWorkExperienceEntry

Agrega experiencia laboral.

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

**Ejemplo de uso:**

```graphql
mutation UpdateWorkExperienceEntry {
  updateWorkExperienceEntry(
    id: "64a1b2c3d4e5f6789012345"
    experienceId: "64a1b2c3d4e5f6789012333"
    experience: {
      company: "TechCorp Solutions"
      position: "Senior Frontend Developer"
      startDate: "2022-01-15"
      endDate: "2024-06-30"
      isCurrentJob: false
      description: "Lideré el desarrollo de aplicaciones web usando React y TypeScript"
      achievements: [
        "Mejoré el rendimiento de la aplicación en un 40%"
        "Implementé arquitectura de microfrontends"
        "Mentoré a 3 desarrolladores junior"
      ]
      skills: ["React", "TypeScript", "Node.js", "GraphQL"]
      salary: { amount: 2500000, currency: CRC }
    }
  ) {
    id
    workExperience {
      id
      company
      position
      isCurrentJob
      achievements
      skills
      salary {
        amount
        currency
      }
    }
    totalWorkExperience
    updatedAt
  }
}
```

### 11. removeWorkExperienceEntry

Remueve experiencia laboral.

**Ejemplo de uso:**

```graphql
mutation RemoveWorkExperienceEntry {
  removeWorkExperienceEntry(
    id: "64a1b2c3d4e5f6789012345"
    experienceId: "64a1b2c3d4e5f6789012444"
  ) {
    id
    workExperience {
      id
      company
      position
      startDate
      endDate
    }
    totalWorkExperience
    isComplete
    updatedAt
  }
}
```

### 12. addCertification

Agrega una certificación.

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

**Ejemplo de uso:**

```graphql
mutation UpdateCertification {
  updateCertification(
    id: "64a1b2c3d4e5f6789012345"
    certificationId: "64a1b2c3d4e5f6789012555"
    certification: {
      name: "AWS Certified Solutions Architect - Professional"
      issuingOrganization: "Amazon Web Services"
      issueDate: "2023-08-15"
      expirationDate: "2026-08-15"
      credentialId: "AWS-PSA-2023-001234"
      credentialUrl: "https://aws.amazon.com/verification/AWS-PSA-2023-001234"
      isActive: true
    }
  ) {
    id
    certifications {
      id
      name
      issuingOrganization
      issueDate
      expirationDate
      isActive
    }
    updatedAt
  }
}
```

### 14. removeCertification

Remueve una certificación.

**Ejemplo de uso:**

```graphql
mutation RemoveCertification {
  removeCertification(
    id: "64a1b2c3d4e5f6789012345"
    certificationId: "64a1b2c3d4e5f6789012666"
  ) {
    id
    certifications {
      id
      name
      issuingOrganization
      isActive
    }
    updatedAt
  }
}
```

### 15. addSkill

Agrega una habilidad.

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

**Ejemplo de uso:**

```graphql
mutation UpdateSkill {
  updateSkill(
    id: "64a1b2c3d4e5f6789012345"
    skillName: "JavaScript"
    skill: {
      name: "JavaScript"
      category: Technical
      proficiencyLevel: Expert
      yearsOfExperience: 6
    }
  ) {
    id
    skills {
      name
      category
      proficiencyLevel
      yearsOfExperience
    }
    updatedAt
  }
}
```

### 17. removeSkill

Remueve una habilidad.

**Ejemplo de uso:**

```graphql
mutation RemoveSkill {
  removeSkill(id: "64a1b2c3d4e5f6789012345", skillName: "jQuery") {
    id
    skills {
      name
      category
      proficiencyLevel
      yearsOfExperience
    }
    updatedAt
  }
}
```

### 18. addLanguage

Agrega un idioma.

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

**Ejemplo de uso:**

```graphql
mutation UpdateLanguage {
  updateLanguage(
    id: "64a1b2c3d4e5f6789012345"
    languageName: "English"
    language: { language: "English", proficiency: Fluent, certified: true }
  ) {
    id
    languages {
      language
      proficiency
      certified
    }
    updatedAt
  }
}
```

### 20. removeLanguage

Remueve un idioma.

**Ejemplo de uso:**

```graphql
mutation RemoveLanguage {
  removeLanguage(id: "64a1b2c3d4e5f6789012345", languageName: "Francés") {
    id
    languages {
      language
      proficiency
      certified
    }
    updatedAt
  }
}
```

### 21. updatePortfolio

Actualiza el portafolio.

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
      phone: "8765-4321"
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

**Ejemplo de uso:**

```graphql
mutation UpdateReference {
  updateReference(
    id: "64a1b2c3d4e5f6789012345"
    referenceId: "64a1b2c3d4e5f6789012777"
    reference: {
      name: "María González"
      position: "Senior Software Engineering Manager"
      company: "TechCorp Solutions"
      email: "maria.gonzalez@techcorp.com"
      phone: "8888-9999"
      relationship: Supervisor
    }
  ) {
    id
    references {
      name
      position
      company
      email
      phone
      relationship
    }
    updatedAt
  }
}
```

### 24. removeReference

Remueve una referencia.

**Ejemplo de uso:**

```graphql
mutation RemoveReference {
  removeReference(
    id: "64a1b2c3d4e5f6789012345"
    referenceId: "64a1b2c3d4e5f6789012888"
  ) {
    id
    references {
      name
      position
      company
      relationship
    }
    updatedAt
  }
}
```

### 25. markCurriculumAsComplete

Marca el currículum como completado.

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
