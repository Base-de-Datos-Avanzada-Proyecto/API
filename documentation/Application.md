# Application GraphQL API Documentation

## Descripción General

Este módulo maneja todas las operaciones relacionadas con aplicaciones a ofertas de trabajo en el sistema. Proporciona funcionalidades completas para crear, actualizar, revisar y gestionar aplicaciones laborales, incluyendo sistemas de prioridad y límites mensuales.

## Tipos de Datos

### Application

```graphql
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

  # Campos virtuales
  isReviewed: Boolean!
  daysSinceApplication: Int!
  expectedSalaryFormatted: String!

  # Relaciones
  professional: Professional
  jobOffer: JobOffer
  reviewer: Employer
}
```

### ExpectedSalary

```graphql
type ExpectedSalary {
  amount: Float
  currency: Currency!
  isNegotiable: Boolean!
}
```

### Enums Principales

- `ApplicationStatus`: Pending, Accepted, Rejected
- `Priority`: Low, Medium, High
- `Currency`: CRC, USD

### Tipos de Respuesta

```graphql
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
```

---

## Queries

### 1. application

Obtiene una aplicación específica por ID.

**Sintaxis:**

```graphql
application(id: ID!): ApplicationResponse!
```

**Ejemplo de uso:**

```graphql
query GetApplication {
  application(id: "64a7b8c9d0e1f2345678901a") {
    success
    message
    application {
      id
      status
      coverLetter
      motivation
      expectedSalary {
        amount
        currency
        isNegotiable
      }
      appliedAt
      reviewedAt
      priority
      isReviewed
      daysSinceApplication

      professional {
        name
        lastName
        email
      }

      jobOffer {
        title
        company
        location {
          canton
        }
      }

      reviewer {
        displayName
      }
    }
    errors
  }
}
```

### 2. applications

Obtiene aplicaciones con filtros avanzados y paginación.

**Sintaxis:**

```graphql
applications(
  filters: ApplicationFilters
  limit: Int = 10
  offset: Int = 0
  sortBy: String = "appliedAt"
  sortOrder: String = "desc"
): ApplicationsResponse!
```

**Filtros disponibles:**

```graphql
input ApplicationFilters {
  status: ApplicationStatus
  priority: Priority
  professionalId: ID
  jobOfferId: ID
  startDate: String
  endDate: String
}
```

**Ejemplo de uso:**

```graphql
query GetFilteredApplications {
  applications(
    filters: {
      status: Pending
      priority: High
      startDate: "2024-01-01"
      endDate: "2024-12-31"
    }
    limit: 20
    offset: 0
    sortBy: "appliedAt"
    sortOrder: "desc"
  ) {
    success
    message
    totalCount
    applications {
      id
      status
      priority
      appliedAt
      daysSinceApplication

      professional {
        name
        lastName
      }

      jobOffer {
        title
        company
      }

      expectedSalary {
        amount
        currency
        isNegotiable
      }
    }
    errors
  }
}
```

### 3. applicationsByProfessional

Obtiene aplicaciones de un profesional específico.

**Sintaxis:**

```graphql
applicationsByProfessional(
  professionalId: ID!
  status: ApplicationStatus
  limit: Int = 10
  offset: Int = 0
): ApplicationsResponse!
```

**Ejemplo de uso:**

```graphql
query GetProfessionalApplications {
  applicationsByProfessional(
    professionalId: "64a7b8c9d0e1f2345678901b"
    status: Pending
    limit: 10
  ) {
    success
    totalCount
    applications {
      id
      status
      appliedAt
      coverLetter
      motivation

      jobOffer {
        id
        title
        company
        applicationDeadline
        status
      }

      expectedSalary {
        amount
        currency
        isNegotiable
      }
    }
  }
}
```

### 4. applicationsByJobOffer

Obtiene aplicaciones para una oferta de trabajo específica.

**Sintaxis:**

```graphql
applicationsByJobOffer(
  jobOfferId: ID!
  status: ApplicationStatus
  limit: Int = 10
  offset: Int = 0
): ApplicationsResponse!
```

**Ejemplo de uso:**

```graphql
query GetJobOfferApplications {
  applicationsByJobOffer(jobOfferId: "64a7b8c9d0e1f2345678901c", limit: 50) {
    success
    totalCount
    applications {
      id
      status
      priority
      appliedAt
      reviewedAt
      notes

      professional {
        name
        lastName
        email
        phone
      }

      expectedSalary {
        amount
        currency
        isNegotiable
      }

      additionalSkills
      availabilityDate
    }
  }
}
```

### 5. canProfessionalApply

Verifica si un profesional puede aplicar a una oferta específica.

**Sintaxis:**

```graphql
canProfessionalApply(
  professionalId: ID!
  jobOfferId: ID!
): CanApplyResponse!
```

**Ejemplo de uso:**

```graphql
query CheckApplicationEligibility {
  canProfessionalApply(
    professionalId: "64a7b8c9d0e1f2345678901b"
    jobOfferId: "64a7b8c9d0e1f2345678901c"
  ) {
    canApply
    reason
    monthlyCount
  }
}
```

### 6. applicationStats

Obtiene estadísticas generales de aplicaciones.

**Sintaxis:**

```graphql
applicationStats: ApplicationStats!
```

**Ejemplo de uso:**

```graphql
query GetApplicationStatistics {
  applicationStats {
    total
    pending
    accepted
    rejected
    avgDaysToReview
  }
}
```

### 7. monthlyApplicationCount

Obtiene el conteo mensual de aplicaciones de un profesional.

**Sintaxis:**

```graphql
monthlyApplicationCount(professionalId: ID!): Int!
```

**Ejemplo de uso:**

```graphql
query GetMonthlyCount {
  monthlyApplicationCount(professionalId: "64a7b8c9d0e1f2345678901b")
}
```

---

## Mutations

### 1. createApplication

Crea una nueva aplicación.

**Sintaxis:**

```graphql
createApplication(input: ApplicationInput!): ApplicationResponse!
```

**Input:**

```graphql
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
```

**Ejemplo de uso:**

```graphql
mutation CreateApplication {
  createApplication(
    input: {
      professionalId: "64a7b8c9d0e1f2345678901b"
      jobOfferId: "64a7b8c9d0e1f2345678901c"
      coverLetter: "Estimado equipo de recursos humanos, me dirijo a ustedes para expresar mi interés en la posición..."
      motivation: "Esta oportunidad representa un paso importante en mi carrera profesional..."
      expectedSalary: { amount: 800000, currency: CRC, isNegotiable: true }
      availabilityDate: "2024-02-01"
      additionalSkills: [
        "Liderazgo de equipos"
        "Metodologías ágiles"
        "Docker"
      ]
    }
  ) {
    success
    message
    application {
      id
      status
      appliedAt
      expectedSalary {
        amount
        currency
        isNegotiable
      }
      professional {
        name
        lastName
      }
      jobOffer {
        title
        company
      }
    }
    errors
  }
}
```

### 2. updateApplication

Actualiza una aplicación existente (solo aplicaciones pendientes).

**Sintaxis:**

```graphql
updateApplication(
  id: ID!
  input: ApplicationUpdateInput!
): ApplicationResponse!
```

**Input:**

```graphql
input ApplicationUpdateInput {
  coverLetter: String
  motivation: String
  expectedSalary: ExpectedSalaryInput
  availabilityDate: String
  additionalSkills: [String!]
}
```

**Ejemplo de uso:**

```graphql
mutation UpdateApplication {
  updateApplication(
    id: "64a7b8c9d0e1f2345678901a"
    input: {
      coverLetter: "Carta de presentación actualizada..."
      expectedSalary: { amount: 850000, currency: CRC, isNegotiable: false }
      additionalSkills: ["Python", "Machine Learning", "AWS"]
    }
  ) {
    success
    message
    application {
      id
      coverLetter
      expectedSalary {
        amount
        currency
        isNegotiable
      }
      additionalSkills
      updatedAt
    }
    errors
  }
}
```

### 3. reviewApplication

Revisa una aplicación (por empleador).

**Sintaxis:**

```graphql
reviewApplication(
  id: ID!
  input: ReviewApplicationInput!
): ApplicationResponse!
```

**Input:**

```graphql
input ReviewApplicationInput {
  status: ApplicationStatus!
  notes: String
  reviewerId: ID
}
```

**Ejemplo de uso:**

```graphql
mutation ReviewApplication {
  reviewApplication(
    id: "64a7b8c9d0e1f2345678901a"
    input: {
      status: Accepted
      notes: "Excelente perfil profesional, cumple con todos los requisitos."
      reviewerId: "64a7b8c9d0e1f2345678901d"
    }
  ) {
    success
    message
    application {
      id
      status
      reviewedAt
      notes
      reviewer {
        displayName
      }
    }
    errors
  }
}
```

### 4. acceptApplication

Acepta una aplicación específica.

**Sintaxis:**

```graphql
acceptApplication(
  id: ID!
  reviewerId: ID
  notes: String
): ApplicationResponse!
```

**Ejemplo de uso:**

```graphql
mutation AcceptApplication {
  acceptApplication(
    id: "64a7b8c9d0e1f2345678901a"
    reviewerId: "64a7b8c9d0e1f2345678901d"
    notes: "Candidato seleccionado para el puesto. Iniciar proceso de contratación."
  ) {
    success
    message
    application {
      id
      status
      reviewedAt
      notes
      professional {
        name
        lastName
        email
      }
    }
    errors
  }
}
```

### 5. rejectApplication

Rechaza una aplicación específica.

**Sintaxis:**

```graphql
rejectApplication(
  id: ID!
  reviewerId: ID
  reason: String
): ApplicationResponse!
```

**Ejemplo de uso:**

```graphql
mutation RejectApplication {
  rejectApplication(
    id: "64a7b8c9d0e1f2345678901a"
    reviewerId: "64a7b8c9d0e1f2345678901d"
    reason: "El perfil no cumple con la experiencia mínima requerida."
  ) {
    success
    message
    application {
      id
      status
      reviewedAt
      notes
    }
    errors
  }
}
```

### 6. setApplicationPriority

Establece la prioridad de una aplicación.

**Sintaxis:**

```graphql
setApplicationPriority(
  id: ID!
  priority: Priority!
): ApplicationResponse!
```

**Ejemplo de uso:**

```graphql
mutation SetPriority {
  setApplicationPriority(id: "64a7b8c9d0e1f2345678901a", priority: High) {
    success
    message
    application {
      id
      priority
      professional {
        name
        lastName
      }
    }
    errors
  }
}
```

### 7. deleteApplication

Elimina una aplicación (soft delete).

**Sintaxis:**

```graphql
deleteApplication(id: ID!): ApplicationResponse!
```

**Ejemplo de uso:**

```graphql
mutation DeleteApplication {
  deleteApplication(id: "64a7b8c9d0e1f2345678901a") {
    success
    message
    application {
      id
      isActive
    }
    errors
  }
}
```

---

## Casos de Uso Comunes

### 1. Flujo completo de aplicación

```graphql
# 1. Verificar elegibilidad
query CheckEligibility {
  canProfessionalApply(
    professionalId: "64a7b8c9d0e1f2345678901b"
    jobOfferId: "64a7b8c9d0e1f2345678901c"
  ) {
    canApply
    reason
    monthlyCount
  }
}

# 2. Crear aplicación
mutation CreateApplication {
  createApplication(
    input: {
      professionalId: "64a7b8c9d0e1f2345678901b"
      jobOfferId: "64a7b8c9d0e1f2345678901c"
      coverLetter: "Mi carta de presentación..."
      motivation: "Mi motivación para este puesto..."
      expectedSalary: { amount: 750000, currency: CRC, isNegotiable: true }
      availabilityDate: "2024-03-01"
      additionalSkills: ["JavaScript", "React", "Node.js"]
    }
  ) {
    success
    message
    application {
      id
      status
      appliedAt
    }
    errors
  }
}
```

### 2. Dashboard de empleador para revisar aplicaciones

```graphql
query EmployerApplicationsDashboard($jobOfferId: ID!) {
  applicationsByJobOffer(jobOfferId: $jobOfferId, limit: 100) {
    success
    totalCount
    applications {
      id
      status
      priority
      appliedAt
      daysSinceApplication

      professional {
        name
        lastName
        email
        phone
      }

      expectedSalary {
        amount
        currency
        isNegotiable
      }

      additionalSkills
      coverLetter
      motivation
    }
  }

  applicationStats {
    total
    pending
    accepted
    rejected
    avgDaysToReview
  }
}
```

### 3. Panel de aplicaciones del profesional

```graphql
query ProfessionalApplicationsPanel($professionalId: ID!) {
  applicationsByProfessional(professionalId: $professionalId, limit: 50) {
    success
    totalCount
    applications {
      id
      status
      appliedAt
      reviewedAt
      priority
      isReviewed
      notes

      jobOffer {
        id
        title
        company
        location {
          canton
        }
        applicationDeadline
        status
      }

      expectedSalary {
        amount
        currency
        isNegotiable
      }
    }
  }

  monthlyApplicationCount(professionalId: $professionalId)
}
```

### 4. Proceso de revisión masiva

```graphql
mutation BatchReviewApplications {
  # Aceptar aplicación prioritaria
  acceptApplication(
    id: "64a7b8c9d0e1f2345678901a"
    reviewerId: "64a7b8c9d0e1f2345678901d"
    notes: "Perfil excepcional, proceder con entrevista."
  ) {
    success
    application {
      id
      status
    }
  }

  # Rechazar aplicación que no cumple requisitos
  rejectApplication(
    id: "64a7b8c9d0e1f2345678901b"
    reviewerId: "64a7b8c9d0e1f2345678901d"
    reason: "No cumple con la experiencia mínima requerida."
  ) {
    success
    application {
      id
      status
    }
  }
}
```
