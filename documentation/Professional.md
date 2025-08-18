# Professional GraphQL API Documentation

## Descripción General

Este módulo maneja todas las operaciones relacionadas con profesionales en el sistema. Proporciona funcionalidades completas para crear, actualizar, revisar y gestionar perfiles básicos de profesionales, incluyendo sistemas de estadísticas, búsquedas avanzadas y gestión de aplicaciones laborales.

## Tipos de Datos

### Professional

```graphql
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

  # Campos virtuales
  fullName: String!
  age: Int

  # Datos relacionados
  curriculum: Curriculum
  professions: [CurriculumProfession!]!
  hasCurriculum: Boolean!
  monthlyApplicationsCount: Int!
  applications: [JobApplication!]!
}
```

### Enums Principales

- `Gender`: Male, Female, Other
- `Canton`: Puntarenas, Esparza, MonteDeOro
- `SortOrder`: ASC, DESC
- `ApplicationStatus`: Pending, Reviewed, Accepted, Rejected, Withdrawn

### Tipos de Respuesta

```graphql
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
```

---

## Queries

### 1. professionals

Obtiene todos los profesionales con filtros avanzados y paginación.

**Sintaxis:**

```graphql
professionals(
  filter: ProfessionalFilter
  sort: ProfessionalSort
  limit: Int
  offset: Int
): [Professional!]!
```

**Filtros disponibles:**

```graphql
input ProfessionalFilter {
  canton: Canton
  gender: Gender
  isActive: Boolean
  professionId: ID
  searchText: String
  ageMin: Int
  ageMax: Int
}
```

**Ejemplo de uso:**

```graphql
query GetActiveProfessionals {
  professionals(
    filter: {
      isActive: true
      canton: Puntarenas
      gender: Male
      ageMin: 25
      ageMax: 45
    }
    sort: { field: firstName, order: ASC }
    limit: 20
    offset: 0
  ) {
    id
    fullName
    email
    phone
    age
    canton
    profileCompleted
    hasCurriculum
    monthlyApplicationsCount

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

### 2. professional

Obtiene un profesional específico por ID.

**Sintaxis:**

```graphql
professional(id: ID!): Professional
```

**Ejemplo de uso:**

```graphql
query GetProfessional {
  professional(id: "64a7b8c9d0e1f2345678901a") {
    id
    cedula
    fullName
    email
    phone
    canton
    address
    birthDate
    age
    gender
    isActive
    profileCompleted
    registrationDate
    lastUpdated

    curriculum {
      id
      summary
      objectives
      isComplete
      isPublic
      totalWorkExperience
      highestEducation
    }

    professions {
      professionId {
        name
        area
      }
      experienceYears
      proficiencyLevel
    }

    hasCurriculum
    monthlyApplicationsCount

    applications {
      id
      jobOfferId
      applicationDate
      status
    }
  }
}
```

### 3. professionalByCedula

Busca un profesional por su número de cédula.

**Sintaxis:**

```graphql
professionalByCedula(cedula: String!): Professional
```

**Ejemplo de uso:**

```graphql
query GetProfessionalByCedula {
  professionalByCedula(cedula: "117890123") {
    id
    fullName
    email
    phone
    canton
    isActive
    profileCompleted
    registrationDate

    curriculum {
      summary
      totalWorkExperience
    }
  }
}
```

### 4. professionalsByCanton

Obtiene profesionales de un cantón específico.

**Sintaxis:**

```graphql
professionalsByCanton(canton: Canton!): [Professional!]!
```

**Ejemplo de uso:**

```graphql
query GetProfessionalsByLocation {
  professionalsByCanton(canton: Esparza) {
    id
    fullName
    email
    phone
    address
    profileCompleted
    hasCurriculum

    professions {
      professionId {
        name
      }
      experienceYears
    }
  }
}
```

### 5. professionalsByProfession

Obtiene profesionales que tienen una profesión específica (a través del currículum).

**Sintaxis:**

```graphql
professionalsByProfession(professionId: ID!): [Professional!]!
```

**Ejemplo de uso:**

```graphql
query GetProfessionalsByProfession {
  professionalsByProfession(professionId: "64a7b8c9d0e1f2345678901c") {
    id
    fullName
    email
    phone
    canton
    age

    professions {
      experienceYears
      proficiencyLevel
    }

    curriculum {
      totalWorkExperience
      highestEducation
    }
  }
}
```

### 6. professionalsByGender

Obtiene profesionales filtrados por género.

**Sintaxis:**

```graphql
professionalsByGender(gender: Gender!): [Professional!]!
```

**Ejemplo de uso:**

```graphql
query GetFemaleProfeesionals {
  professionalsByGender(gender: Female) {
    id
    fullName
    email
    canton
    age
    profileCompleted
    hasCurriculum

    professions {
      professionId {
        name
      }
    }
  }
}
```

### 7. professionalGenderStats

Obtiene estadísticas de profesionales por género.

**Sintaxis:**

```graphql
professionalGenderStats: [ProfessionalGenderStats!]!
```

**Ejemplo de uso:**

```graphql
query GetGenderStatistics {
  professionalGenderStats {
    gender
    count
  }
}
```

### 8. professionalProfessionStats

Obtiene estadísticas de profesionales por área profesional.

**Sintaxis:**

```graphql
professionalProfessionStats: [ProfessionalProfessionStats!]!
```

**Ejemplo de uso:**

```graphql
query GetProfessionStatistics {
  professionalProfessionStats {
    profession {
      name
      area
    }
    count
    percentage
  }
}
```

### 9. professionalsCount

Cuenta el número total de profesionales con filtros opcionales.

**Sintaxis:**

```graphql
professionalsCount(filter: ProfessionalFilter): Int!
```

**Ejemplo de uso:**

```graphql
query CountActiveProfessionals {
  professionalsCount(filter: { isActive: true, profileCompleted: true })
}
```

### 10. professionalInfo

Obtiene información específica de un profesional para reportes.

**Sintaxis:**

```graphql
professionalInfo(cedula: String!): ProfessionalInfo
```

**Ejemplo de uso:**

```graphql
query GetProfessionalReport {
  professionalInfo(cedula: "117890123") {
    cedula
    name
    professions
  }
}
```

### 11. searchProfessionals

Busca profesionales por texto en múltiples campos.

**Sintaxis:**

```graphql
searchProfessionals(searchText: String!): [Professional!]!
```

**Ejemplo de uso:**

```graphql
query SearchProfessionals {
  searchProfessionals(searchText: "juan desarrollador") {
    id
    fullName
    email
    phone
    canton

    professions {
      professionId {
        name
      }
    }

    curriculum {
      summary
      totalWorkExperience
    }
  }
}
```

### 12. professionalsByAgeRange

Obtiene profesionales por rango de edad.

**Sintaxis:**

```graphql
professionalsByAgeRange(minAge: Int!, maxAge: Int!): [Professional!]!
```

**Ejemplo de uso:**

```graphql
query GetYoungProfessionals {
  professionalsByAgeRange(minAge: 22, maxAge: 35) {
    id
    fullName
    age
    email
    canton
    profileCompleted

    professions {
      professionId {
        name
      }
      experienceYears
    }
  }
}
```

---

## Mutations

### 1. createProfessional

Crea un nuevo profesional (perfil básico únicamente).

**Sintaxis:**

```graphql
createProfessional(input: ProfessionalInput!): Professional!
```

**Input:**

```graphql
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
```

**Ejemplo de uso:**

```graphql
mutation CreateProfessional {
  createProfessional(
    input: {
      cedula: "117890123"
      firstName: "María"
      lastName: "González"
      email: "maria.gonzalez@email.com"
      phone: "87654321"
      canton: Puntarenas
      address: "Barrio El Carmen, Puntarenas"
      birthDate: "1990-05-15"
      gender: Female
    }
  ) {
    id
    fullName
    email
    canton
    age
    isActive
    profileCompleted
    registrationDate
  }
}
```

### 2. updateProfessional

Actualiza información básica de un profesional existente.

**Sintaxis:**

```graphql
updateProfessional(id: ID!, input: ProfessionalUpdateInput!): Professional!
```

**Input:**

```graphql
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
```

**Ejemplo de uso:**

```graphql
mutation UpdateProfessional {
  updateProfessional(
    id: "64a7b8c9d0e1f2345678901a"
    input: {
      phone: "87651234"
      email: "maria.nuevo@email.com"
      address: "Nueva dirección en Puntarenas"
      canton: Esparza
    }
  ) {
    id
    fullName
    email
    phone
    address
    canton
    lastUpdated
  }
}
```

### 3. deleteProfessional

Elimina un profesional (soft delete - marca como inactivo).

**Sintaxis:**

```graphql
deleteProfessional(id: ID!): Boolean!
```

**Ejemplo de uso:**

```graphql
mutation DeleteProfessional {
  deleteProfessional(id: "64a7b8c9d0e1f2345678901a")
}
```

### 4. toggleProfessionalStatus

Cambia el estado activo/inactivo de un profesional.

**Sintaxis:**

```graphql
toggleProfessionalStatus(id: ID!): Professional!
```

**Ejemplo de uso:**

```graphql
mutation ToggleProfessionalStatus {
  toggleProfessionalStatus(id: "64a7b8c9d0e1f2345678901a") {
    id
    fullName
    isActive
    lastUpdated
  }
}
```

### 5. updateProfessionalContact

Actualiza información de contacto específica del profesional.

**Sintaxis:**

```graphql
updateProfessionalContact(
  id: ID!
  email: String
  phone: String
  address: String
): Professional!
```

**Ejemplo de uso:**

```graphql
mutation UpdateProfessionalContact {
  updateProfessionalContact(
    id: "64a7b8c9d0e1f2345678901a"
    email: "nuevo.email@correo.com"
    phone: "89123456"
    address: "Nueva dirección profesional"
  ) {
    id
    fullName
    email
    phone
    address
    lastUpdated
  }
}
```

### 6. completeProfile

Marca el perfil profesional como completado.

**Sintaxis:**

```graphql
completeProfile(id: ID!): Professional!
```

**Ejemplo de uso:**

```graphql
mutation CompleteProfile {
  completeProfile(id: "64a7b8c9d0e1f2345678901a") {
    id
    fullName
    profileCompleted
    lastUpdated
  }
}
```

### 7. validateMonthlyApplicationLimit

Valida el límite mensual de aplicaciones del profesional.

**Sintaxis:**

```graphql
validateMonthlyApplicationLimit(professionalId: ID!): ApplicationLimitStatus!
```

**Ejemplo de uso:**

```graphql
mutation ValidateApplicationLimit {
  validateMonthlyApplicationLimit(professionalId: "64a7b8c9d0e1f2345678901a") {
    canApply
    remaining
    used
  }
}
```

---

## Casos de Uso Comunes

### 1. Registro completo de profesional

```graphql
mutation RegisterProfessional {
  createProfessional(
    input: {
      cedula: "205340789"
      firstName: "Carlos"
      lastName: "Mendoza"
      email: "carlos.mendoza@email.com"
      phone: "87654321"
      canton: Esparza
      address: "Centro de Esparza, 200m norte del parque"
      birthDate: "1988-03-20"
      gender: Male
    }
  ) {
    id
    fullName
    email
    age
    canton
    isActive
    profileCompleted
    registrationDate
    hasCurriculum
  }
}
```

### 2. Búsqueda avanzada de profesionales

```graphql
query AdvancedProfessionalSearch {
  professionals(
    filter: {
      canton: Puntarenas
      isActive: true
      ageMin: 25
      ageMax: 40
      professionId: "64a7b8c9d0e1f2345678901c"
    }
    sort: { field: lastName, order: ASC }
    limit: 50
  ) {
    id
    fullName
    email
    phone
    age
    canton
    profileCompleted

    curriculum {
      summary
      totalWorkExperience
      highestEducation
    }

    professions {
      professionId {
        name
        area
      }
      experienceYears
      proficiencyLevel
    }
  }

  professionalsCount(
    filter: {
      canton: Puntarenas
      isActive: true
      ageMin: 25
      ageMax: 40
      professionId: "64a7b8c9d0e1f2345678901c"
    }
  )
}
```

### 3. Dashboard de administrador de profesionales

```graphql
query ProfessionalAdminDashboard {
  # Estadísticas generales
  professionalGenderStats {
    gender
    count
  }

  professionalProfessionStats {
    profession {
      name
      area
    }
    count
    percentage
  }

  # Conteos totales
  totalProfessionals: professionalsCount
  activeProfessionals: professionalsCount(filter: { isActive: true })
  completedProfiles: professionalsCount(filter: { profileCompleted: true })

  # Profesionales recientes
  recentProfessionals: professionals(
    sort: { field: registrationDate, order: DESC }
    limit: 10
  ) {
    id
    fullName
    email
    canton
    registrationDate
    profileCompleted
    hasCurriculum
  }
}
```

### 4. Panel de profesional individual

```graphql
query ProfessionalProfile($professionalId: ID!) {
  professional(id: $professionalId) {
    id
    cedula
    fullName
    email
    phone
    canton
    address
    age
    gender
    isActive
    profileCompleted
    registrationDate
    lastUpdated

    curriculum {
      id
      summary
      objectives
      isComplete
      isPublic
      totalWorkExperience
      highestEducation
      version
      lastReviewed

      professions {
        professionId {
          name
          area
        }
        experienceYears
        proficiencyLevel
      }

      education {
        institution
        degree
        educationLevel
        isCompleted
      }

      skills {
        name
        category
        proficiencyLevel
      }
    }

    monthlyApplicationsCount

    applications {
      id
      jobOfferId
      status
      applicationDate

      # TODO: Implementar cuando esté disponible JobOffer
      # jobOffer {
      #   title
      #   company
      # }
    }
  }

  # Validación de límite mensual
  validateMonthlyApplicationLimit(professionalId: $professionalId) {
    canApply
    remaining
    used
  }
}
```

### 5. Búsqueda de talento para empleadores

```graphql
query TalentSearch($professionId: ID!, $canton: Canton) {
  professionalsByProfession(professionId: $professionId) {
    id
    fullName
    email
    phone
    canton
    age
    profileCompleted

    curriculum {
      summary
      totalWorkExperience
      highestEducation
      isPublic

      skills {
        name
        category
        proficiencyLevel
        yearsOfExperience
      }

      workExperience {
        company
        position
        isCurrentJob
        description
      }

      education {
        institution
        degree
        educationLevel
      }
    }

    professions {
      experienceYears
      proficiencyLevel
    }
  }

  # Filtrar por cantón si se especifica
  professionalsByCanton(canton: $canton) {
    id
    fullName
    hasCurriculum

    curriculum {
      summary
      isPublic
    }
  }
}
```

### 6. Actualización masiva de contactos

```graphql
mutation UpdateProfessionalContacts {
  # Actualizar contacto del profesional 1
  updateContact1: updateProfessionalContact(
    id: "64a7b8c9d0e1f2345678901a"
    email: "nuevo1@email.com"
    phone: "87651234"
  ) {
    id
    fullName
    email
    phone
  }

  # Actualizar contacto del profesional 2
  updateContact2: updateProfessionalContact(
    id: "64a7b8c9d0e1f2345678901b"
    email: "nuevo2@email.com"
    address: "Nueva dirección"
  ) {
    id
    fullName
    email
    address
  }
}
```

---

## Subscriptions (Para futuras funcionalidades en tiempo real)

### 1. professionalRegistered

Se suscribe a nuevos registros de profesionales.

**Sintaxis:**

```graphql
subscription NewProfessionals {
  professionalRegistered {
    id
    fullName
    email
    canton
    registrationDate
  }
}
```

### 2. professionalUpdated

Se suscribe a actualizaciones de un profesional específico.

**Sintaxis:**

```graphql
subscription ProfessionalUpdates($professionalId: ID!) {
  professionalUpdated(id: $professionalId) {
    id
    fullName
    profileCompleted
    lastUpdated
  }
}
```
