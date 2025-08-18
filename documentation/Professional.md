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
      canton: Esparza
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

**Ejemplo de uso:**

```graphql
query GetProfessional {
  professional(id: "68a24a524e9922180b1aa269") {
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
        category
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

**Ejemplo de uso:**

```graphql
query GetProfessionalByCedula {
  professionalByCedula(cedula: "1-1234-5678") {
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

**Ejemplo de uso:**

```graphql
query GetProfessionalsByProfession {
  professionalsByProfession(professionId: "68a24a524e9922180b1aa259") {
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

**Ejemplo de uso:**

```graphql
query GetFemaleProfesionals {
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

Obtiene estadísticas de profesionales por categoria profesional.

**Ejemplo de uso:**

```graphql
query GetProfessionStatistics {
  professionalProfessionStats {
    profession {
      name
      category
    }
    count
    percentage
  }
}
```

### 9. professionalsCount

Cuenta el número total de profesionales con filtros opcionales.

**Ejemplo de uso:**

```graphql
query CountActiveProfessionals {
  professionalsCount(filter: { isActive: true, profileCompleted: true })
}
```

### 10. professionalInfo

Obtiene información específica de un profesional para reportes.

**Ejemplo de uso:**

```graphql
query GetProfessionalReport {
  professionalInfo(cedula: "2-2345-6789") {
    cedula
    name
    professions
  }
}
```

### 11. professionalsByAgeRange

Obtiene profesionales por rango de edad.

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

**Ejemplo de uso:**

```graphql
mutation CreateProfessional {
  createProfessional(
    input: {
      cedula: "6-6345-1349"
      firstName: "Joan"
      lastName: "Parra"
      email: "joan.parra@email.com"
      phone: "6565-2221"
      canton: Puntarenas
      address: "Barrio El Carmen, Puntarenas"
      birthDate: "1990-05-15"
      gender: Male
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

**Ejemplo de uso:**

```graphql
mutation UpdateProfessional {
  updateProfessional(
    id: "68a3975ed61be21a7fd3f39f"
    input: {
      email: "joan.nuevo@email.com"
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

**Ejemplo de uso:**

```graphql
mutation DeleteProfessional {
  deleteProfessional(id: "64a7b8c9d0e1f2345678901a")
}
```

### 4. toggleProfessionalStatus

Cambia el estado activo/inactivo de un profesional.

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

**Ejemplo de uso:**

```graphql
mutation UpdateProfessionalContact {
  updateProfessionalContact(
    id: "68a3975ed61be21a7fd3f39f"
    email: "nuevo.email@correo.com"
    phone: "8912-3456"
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

**Ejemplo de uso:**

```graphql
mutation CompleteProfile {
  completeProfile(id: "68a3975ed61be21a7fd3f39f") {
    id
    fullName
    profileCompleted
    lastUpdated
  }
}
```

### 7. validateMonthlyApplicationLimit

Valida el límite mensual de aplicaciones del profesional.

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
      cedula: "2-0534-0789"
      firstName: "Carlos"
      lastName: "Mendoza"
      email: "carlos.mendoza@email.com"
      phone: "8765-4321"
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
        category
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
      category
    }
    count
    percentage
  }

  # Conteos totales
  totalProfessionals: professionalsCount
  activeProfessionals: professionalsCount(filter: { isActive: true })

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
