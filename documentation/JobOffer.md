# Job Offer GraphQL API Documentation

## Descripción General

Este módulo maneja todas las operaciones relacionadas con ofertas de trabajo (vacant positions) en el sistema. Proporciona funcionalidades completas para crear, actualizar, gestionar y buscar ofertas laborales, incluyendo sistemas de publicación, filtrado avanzado y estadísticas.

## Tipos de Datos

### JobOffer

```graphql
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

  # Campos virtuales
  isExpired: Boolean!
  daysUntilDeadline: Int!
  salaryRange: String!

  # Datos relacionados
  applications: [JobApplication!]!
  employer: Employer!
}
```

### Tipos Relacionados

```graphql
type JobLocation {
  canton: Canton!
  specificLocation: String
}

type JobSalary {
  min: Float
  max: Float
  currency: Currency!
  isNegotiable: Boolean!
}

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
```

### Enums Principales

- `WorkType`: Full_time, Part_time, Contract, Temporary, Internship
- `WorkModality`: On_site, Remote, Hybrid
- `EducationLevel`: None, High_School, Technical, Bachelor, Master, PhD
- `JobOfferStatus`: Draft, Published, Paused, Closed, Filled
- `Canton`: Puntarenas, Esparza, MonteDeOro
- `Currency`: CRC, USD
- `SortOrder`: ASC, DESC
- `JobOfferSortField`: title, publishedAt, applicationDeadline, viewCount, applicationCount, createdAt, salary

---

## Queries

### 1. jobOffers

Obtiene todas las ofertas de trabajo con filtros avanzados, ordenamiento y paginación.

**Filtros disponibles:**

```graphql
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
```

**Ejemplo de uso:**

```graphql
query GetActiveJobOffers {
  jobOffers(
    filter: {
      isActive: true
      status: Published
      isExpired: false
      canton: Puntarenas
      workType: Full_time
      salaryMin: 500000
    }
    sort: { field: publishedAt, order: DESC }
    limit: 20
    offset: 0
  ) {
    id
    title
    description
    salaryRange
    isExpired
    daysUntilDeadline

    employer {
      displayName
      canton
    }

    location {
      canton
      specificLocation
    }

    salary {
      min
      max
      currency
      isNegotiable
    }

    requiredProfessions {
      name
    }

    workType
    workModality
    experienceRequired
    educationLevel
    applicationDeadline
    viewCount
    applicationCount
  }
}
```

### 2. jobOffer

Obtiene una oferta de trabajo específica por ID.

**Ejemplo de uso:**

```graphql
query GetJobOfferDetails {
  jobOffer(id: "64a7b8c9d0e1f2345678901a") {
    id
    title
    description
    requirements
    preferredSkills
    experienceRequired
    educationLevel
    applicationDeadline
    maxApplications
    isActive
    isFeatured
    status
    contactEmail
    contactPhone
    viewCount
    applicationCount
    publishedAt
    lastUpdated

    employer {
      id
      displayName
      businessSector
      email
      phone
      website
    }

    location {
      canton
      specificLocation
    }

    salary {
      min
      max
      currency
      isNegotiable
    }

    requiredProfessions {
      id
      name
    }

    applications {
      id
      status
      appliedAt
      professional {
        name
        lastName
      }
    }

    # Campos virtuales
    isExpired
    daysUntilDeadline
    salaryRange
  }
}
```

### 3. jobOffersByEmployer

Obtiene ofertas de trabajo de un empleador específico.

**Ejemplo de uso:**

```graphql
query GetEmployerJobOffers {
  jobOffersByEmployer(employerId: "64a7b8c9d0e1f2345678901b") {
    id
    title
    status
    workType
    applicationDeadline
    isExpired
    applicationCount
    viewCount

    location {
      canton
    }

    salary {
      min
      max
      currency
    }
  }
}
```

### 4. jobOffersByProfession

Obtiene ofertas filtradas por profesión requerida.

**Ejemplo de uso:**

```graphql
query GetJobOffersByProfession {
  jobOffersByProfession(professionId: "64a7b8c9d0e1f2345678901c") {
    id
    title
    description
    employer {
      displayName
    }
    workType
    workModality
    applicationDeadline
    isExpired
    salaryRange
  }
}
```

### 5. jobOffersByCanton

Obtiene ofertas de trabajo por cantón.

**Ejemplo de uso:**

```graphql
query GetJobOffersByCanton {
  jobOffersByCanton(canton: Esparza) {
    id
    title
    employer {
      displayName
    }
    location {
      specificLocation
    }
    workType
    applicationDeadline
    salaryRange
  }
}
```

### 6. activeJobOffers

Obtiene todas las ofertas de trabajo activas y publicadas.

**Ejemplo de uso:**

```graphql
query GetActiveJobOffers {
  activeJobOffers {
    id
    title
    employer {
      displayName
    }
    location {
      canton
    }
    workType
    applicationDeadline
    daysUntilDeadline
    viewCount
    applicationCount
  }
}
```

### 7. featuredJobOffers

Obtiene ofertas de trabajo destacadas.

**Ejemplo de uso:**

```graphql
query GetFeaturedJobs {
  featuredJobOffers(limit: 5) {
    id
    title
    description
    employer {
      displayName
      businessSector
    }
    salaryRange
    workType
    workModality
    location {
      canton
    }
    applicationDeadline
    isExpired
  }
}
```

### 8. jobOfferStats

Obtiene estadísticas generales de ofertas de trabajo.

**Ejemplo de uso:**

```graphql
query GetJobOfferStatistics {
  jobOfferStats {
    total
    active
    published
    expired
  }
}
```

### 9. vacantPositions

Obtiene inventario simplificado de posiciones vacantes para reportes.

**Ejemplo de uso:**

```graphql
query GetVacantPositionsReport {
  vacantPositions {
    id
    title
    employer
    canton
    workType
    applicationDeadline
    status
  }
}
```

### 10. jobOffersCount

Cuenta el total de ofertas con filtros opcionales.

**Ejemplo de uso:**

```graphql
query CountActiveJobs {
  jobOffersCount(
    filter: { isActive: true, status: Published, isExpired: false }
  )
}
```

### 11. searchJobOffers

Busca ofertas por texto en múltiples campos.

**Ejemplo de uso:**

```graphql
query SearchJobs {
  searchJobOffers(searchText: "desarrollador software") {
    id
    title
    description
    employer {
      displayName
    }
    requiredProfessions {
      name
    }
    requirements
    preferredSkills
    salaryRange
    workType
  }
}
```

### 12. expiringJobOffers

Obtiene ofertas que expiran dentro de X días.

**Ejemplo de uso:**

```graphql
query GetExpiringJobs {
  expiringJobOffers(days: 3) {
    id
    title
    employer {
      displayName
      email
    }
    applicationDeadline
    daysUntilDeadline
    applicationCount
  }
}
```

### 13. mostViewedJobOffers

Obtiene las ofertas más vistas.

**Ejemplo de uso:**

```graphql
query GetPopularJobs {
  mostViewedJobOffers(limit: 10) {
    id
    title
    employer {
      displayName
    }
    viewCount
    applicationCount
    workType
    salaryRange
  }
}
```

---

## Mutations

### 1. createJobOffer

Crea una nueva oferta de trabajo.

**Ejemplo de uso:**

```graphql
mutation CreateJobOffer {
  createJobOffer(
    input: {
      title: "Desarrollador Full-Stack Senior"
      description: "Buscamos un desarrollador experimentado para liderar proyectos de desarrollo web usando tecnologías modernas como React, Node.js y MongoDB."
      employerId: "64a7b8c9d0e1f2345678901b"
      requiredProfessions: [
        "64a7b8c9d0e1f2345678901c"
        "64a7b8c9d0e1f2345678901d"
      ]
      workType: Full_time
      workModality: Hybrid
      location: {
        canton: Puntarenas
        specificLocation: "Centro de Puntarenas, oficinas modernas"
      }
      salary: { min: 800000, max: 1200000, currency: CRC, isNegotiable: true }
      requirements: [
        "Mínimo 5 años de experiencia en desarrollo web"
        "Conocimientos avanzados en JavaScript, React y Node.js"
        "Experiencia con bases de datos NoSQL"
        "Metodologías ágiles (Scrum/Kanban)"
      ]
      preferredSkills: [
        "Docker y contenedores"
        "AWS o cloud computing"
        "TypeScript"
        "GraphQL"
        "Liderazgo de equipos"
      ]
      experienceRequired: 5
      educationLevel: Bachelor
      applicationDeadline: "2024-03-15T23:59:59Z"
      maxApplications: 50
      contactEmail: "rrhh@empresa.com"
      contactPhone: "25551234"
      isFeatured: false
    }
  ) {
    id
    title
    status
    isActive
    createdAt
    employer {
      displayName
    }
    salaryRange
    daysUntilDeadline
  }
}
```

### 2. updateJobOffer

Actualiza una oferta de trabajo existente.

**Ejemplo de uso:**

```graphql
mutation UpdateJobOffer {
  updateJobOffer(
    id: "64a7b8c9d0e1f2345678901a"
    input: {
      title: "Desarrollador Full-Stack Senior (Actualizado)"
      description: "Descripción actualizada con nuevos requerimientos..."
      salary: { min: 900000, max: 1300000, currency: CRC, isNegotiable: true }
      maxApplications: 75
      preferredSkills: [
        "Docker y Kubernetes"
        "AWS certificación"
        "TypeScript avanzado"
        "GraphQL y Apollo"
        "Liderazgo y mentoría"
      ]
    }
  ) {
    id
    title
    description
    salary {
      min
      max
      currency
    }
    preferredSkills
    lastUpdated
  }
}
```

### 3. deleteJobOffer

Elimina una oferta de trabajo (soft delete).

**Ejemplo de uso:**

```graphql
mutation DeleteJobOffer {
  deleteJobOffer(id: "64a7b8c9d0e1f2345678901a")
}
```

### 4. publishJobOffer

Publica una oferta de trabajo.

**Ejemplo de uso:**

```graphql
mutation PublishJobOffer {
  publishJobOffer(id: "64a7b8c9d0e1f2345678901a") {
    id
    title
    status
    publishedAt
    isActive
    employer {
      displayName
    }
  }
}
```

### 5. pauseJobOffer

Pausa una oferta de trabajo publicada.

**Ejemplo de uso:**

```graphql
mutation PauseJobOffer {
  pauseJobOffer(id: "64a7b8c9d0e1f2345678901a") {
    id
    title
    status
    lastUpdated
  }
}
```

### 6. closeJobOffer

Cierra una oferta de trabajo.

**Ejemplo de uso:**

```graphql
mutation CloseJobOffer {
  closeJobOffer(id: "64a7b8c9d0e1f2345678901a", filled: true) {
    id
    title
    status
    lastUpdated
    applicationCount
  }
}
```

### 7. reopenJobOffer

Reabre una oferta de trabajo cerrada o pausada.

**Ejemplo de uso:**

```graphql
mutation ReopenJobOffer {
  reopenJobOffer(id: "64a7b8c9d0e1f2345678901a") {
    id
    title
    status
    isActive
    applicationDeadline
    daysUntilDeadline
  }
}
```

### 8. toggleJobOfferFeatured

Cambia el estado destacado de una oferta.

**Ejemplo de uso:**

```graphql
mutation ToggleFeaturedJob {
  toggleJobOfferFeatured(id: "64a7b8c9d0e1f2345678901a") {
    id
    title
    isFeatured
    lastUpdated
  }
}
```

### 9. incrementJobOfferViews

Incrementa el contador de visualizaciones.

**Ejemplo de uso:**

```graphql
mutation IncrementViews {
  incrementJobOfferViews(id: "64a7b8c9d0e1f2345678901a") {
    id
    viewCount
  }
}
```

### 10. createJobOffers

Crea múltiples ofertas de trabajo (carga masiva).

**Ejemplo de uso:**

```graphql
mutation BulkCreateJobOffers {
  createJobOffers(
    input: [
      {
        title: "Desarrollador Junior"
        description: "Posición para desarrollador junior..."
        employerId: "64a7b8c9d0e1f2345678901b"
        requiredProfessions: ["64a7b8c9d0e1f2345678901c"]
        workType: Full_time
        workModality: On_site
        location: { canton: Puntarenas }
        applicationDeadline: "2024-04-01T23:59:59Z"
        experienceRequired: 1
      }
      {
        title: "Analista de Sistemas"
        description: "Analista para sistemas empresariales..."
        employerId: "64a7b8c9d0e1f2345678901b"
        requiredProfessions: ["64a7b8c9d0e1f2345678901d"]
        workType: Full_time
        workModality: Hybrid
        location: { canton: Esparza }
        applicationDeadline: "2024-04-15T23:59:59Z"
        experienceRequired: 3
      }
    ]
  ) {
    id
    title
    status
    employer {
      displayName
    }
  }
}
```

### 11. extendApplicationDeadline

Extiende la fecha límite de aplicación.

**Ejemplo de uso:**

```graphql
mutation ExtendDeadline {
  extendApplicationDeadline(
    id: "64a7b8c9d0e1f2345678901a"
    newDeadline: "2024-04-30T23:59:59Z"
  ) {
    id
    title
    applicationDeadline
    daysUntilDeadline
    lastUpdated
  }
}
```

### 12. updateJobOfferRequirements

Actualiza requisitos y habilidades preferidas.

**Ejemplo de uso:**

```graphql
mutation UpdateRequirements {
  updateJobOfferRequirements(
    id: "64a7b8c9d0e1f2345678901a"
    requirements: [
      "Mínimo 3 años de experiencia en desarrollo web"
      "Conocimientos sólidos en JavaScript y frameworks modernos"
      "Experiencia con APIs REST"
      "Conocimientos de Git y control de versiones"
    ]
    preferredSkills: [
      "React.js y Vue.js"
      "Node.js y Express"
      "MongoDB y PostgreSQL"
      "Docker básico"
      "Metodologías ágiles"
    ]
  ) {
    id
    requirements
    preferredSkills
    lastUpdated
  }
}
```

### 13. cloneJobOffer

Clona una oferta de trabajo existente.

**Ejemplo de uso:**

```graphql
mutation CloneJobOffer {
  cloneJobOffer(
    id: "64a7b8c9d0e1f2345678901a"
    title: "Desarrollador Full-Stack Senior - Copia para nuevo proyecto"
  ) {
    id
    title
    status
    createdAt
    employer {
      displayName
    }
  }
}
```

---

## Casos de Uso Comunes

### 1. Creación completa de oferta de trabajo

```graphql
mutation CreateCompleteJobOffer {
  createJobOffer(
    input: {
      title: "Ingeniero de Software Senior"
      description: "Únete a nuestro equipo como Ingeniero de Software Senior. Trabajarás en el desarrollo de aplicaciones web de alta escala, liderando proyectos técnicos y mentoreando desarrolladores junior."
      employerId: "64a7b8c9d0e1f2345678901b"
      requiredProfessions: [
        "64a7b8c9d0e1f2345678901c" # Ingeniería en Sistemas
        "64a7b8c9d0e1f2345678901d" # Ingeniería en Software
      ]
      workType: Full_time
      workModality: Hybrid
      location: {
        canton: Puntarenas
        specificLocation: "Edificio corporativo, zona centro"
      }
      salary: { min: 1000000, max: 1500000, currency: CRC, isNegotiable: true }
      requirements: [
        "Licenciatura en Ingeniería en Sistemas, Software o afines"
        "Mínimo 5 años de experiencia en desarrollo de software"
        "Experiencia sólida con JavaScript, TypeScript, React y Node.js"
        "Conocimientos de bases de datos relacionales y NoSQL"
        "Experiencia con metodologías ágiles (Scrum, Kanban)"
        "Inglés conversacional"
      ]
      preferredSkills: [
        "Experiencia con cloud computing (AWS, Azure, GCP)"
        "Conocimientos de DevOps y CI/CD"
        "Experiencia con contenedores (Docker, Kubernetes)"
        "Arquitectura de microservicios"
        "Liderazgo técnico y mentoría"
        "Certificaciones técnicas relevantes"
      ]
      experienceRequired: 5
      educationLevel: Bachelor
      applicationDeadline: "2024-05-01T23:59:59Z"
      maxApplications: 100
      contactEmail: "careers@techcompany.com"
      contactPhone: "25551234"
      isFeatured: true
    }
  ) {
    id
    title
    status
    salaryRange
    daysUntilDeadline
    employer {
      displayName
      businessSector
    }
  }
}
```

### 2. Dashboard de empleador para gestionar ofertas

```graphql
query EmployerJobOffersDashboard($employerId: ID!) {
  jobOffersByEmployer(employerId: $employerId) {
    id
    title
    status
    workType
    applicationDeadline
    isExpired
    daysUntilDeadline
    applicationCount
    viewCount
    isFeatured

    location {
      canton
      specificLocation
    }

    requiredProfessions {
      name
    }

    applications {
      id
      status
      appliedAt
      professional {
        name
        lastName
      }
    }
  }

  jobOfferStats {
    total
    active
    published
    expired
  }
}
```

### 3. Portal de búsqueda de empleos para profesionales

```graphql
query JobSearchPortal(
  $canton: Canton
  $workType: WorkType
  $professionId: ID
  $salaryMin: Float
  $searchText: String
) {
  activeJobOffers: jobOffers(
    filter: {
      isActive: true
      status: Published
      isExpired: false
      canton: $canton
      workType: $workType
      requiredProfessions: [$professionId]
      salaryMin: $salaryMin
      searchText: $searchText
    }
    sort: { field: publishedAt, order: DESC }
    limit: 20
  ) {
    id
    title
    description
    salaryRange
    workType
    workModality
    applicationDeadline
    daysUntilDeadline
    viewCount

    employer {
      displayName
      businessSector
    }

    location {
      canton
      specificLocation
    }

    requiredProfessions {
      name
    }

    requirements
    preferredSkills
    experienceRequired
    educationLevel
  }

  featuredJobOffers(limit: 5) {
    id
    title
    employer {
      displayName
    }
    salaryRange
    workType
  }

  jobOfferStats {
    total
    active
    published
  }
}
```

### 4. Proceso de gestión del ciclo de vida de ofertas

```graphql
# Crear oferta en borrador
mutation CreateDraftOffer {
  createJobOffer(input: $jobOfferInput) {
    id
    title
    status # Draft
  }
}

# Publicar oferta
mutation PublishOffer {
  publishJobOffer(id: "64a7b8c9d0e1f2345678901a") {
    id
    status # Published
    publishedAt
  }
}

# Pausar temporalmente
mutation PauseOffer {
  pauseJobOffer(id: "64a7b8c9d0e1f2345678901a") {
    id
    status # Paused
  }
}

# Reabrir oferta
mutation ReopenOffer {
  reopenJobOffer(id: "64a7b8c9d0e1f2345678901a") {
    id
    status # Published
    isActive
  }
}

# Cerrar oferta (posición llenada)
mutation CloseFilledPosition {
  closeJobOffer(id: "64a7b8c9d0e1f2345678901a", filled: true) {
    id
    status # Filled
    applicationCount
  }
}
```

### 5. Sistema de monitoreo y alertas

```graphql
query MonitoringDashboard {
  # Ofertas que expiran pronto
  expiringJobs: expiringJobOffers(days: 7) {
    id
    title
    employer {
      displayName
      email
    }
    applicationDeadline
    daysUntilDeadline
    applicationCount
  }

  # Ofertas más populares
  popularJobs: mostViewedJobOffers(limit: 10) {
    id
    title
    employer {
      displayName
    }
    viewCount
    applicationCount
  }

  # Estadísticas generales
  stats: jobOfferStats {
    total
    active
    published
    expired
  }

  # Inventario de posiciones vacantes
  vacantPositions {
    id
    title
    employer
    canton
    workType
    applicationDeadline
    status
  }
}
```
