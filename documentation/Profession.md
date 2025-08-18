# Profession GraphQL API Documentation

## Descripción General

Este módulo maneja todas las operaciones relacionadas con el catálogo de profesiones en el sistema. Proporciona funcionalidades completas para gestionar profesiones, incluyendo categorización, estadísticas de demanda, habilidades requeridas y vinculación con profesionales y ofertas de trabajo.

## Tipos de Datos

### Profession

```graphql
type Profession {
  id: ID!
  name: String!
  code: String!
  category: ProfessionCategory!
  subcategory: String
  description: String!
  requirements: [String!]!
  skills: [String!]!
  averageSalaryRange: SalaryRange
  isActive: Boolean!
  demandLevel: DemandLevel!
  registeredProfessionals: Int!
  activeJobOffers: Int!
  createdBy: String!
  lastUpdated: String!
  createdAt: String!
  updatedAt: String!

  # Campos virtuales
  professionalCount: Int!
  jobOfferCount: Int!
  popularity: Int!
}
```

### SalaryRange

```graphql
type SalaryRange {
  min: Float
  max: Float
  currency: Currency!
}
```

### Estadísticas

```graphql
type ProfessionCategoryStats {
  category: ProfessionCategory!
  count: Int!
  totalProfessionals: Int!
  totalJobOffers: Int!
  averageSalaryMin: Float
  averageSalaryMax: Float
}
```

### Enums Principales

- `ProfessionCategory`: Technology, Healthcare, Education, Engineering, Business, Arts, Services, Construction, Agriculture, Transportation, Other
- `DemandLevel`: Low, Medium, High, Critical
- `Currency`: CRC, USD
- `SortOrder`: ASC, DESC

---

## Queries

### 1. professions

Obtiene todas las profesiones con filtros avanzados, ordenamiento y paginación.

**Sintaxis:**

```graphql
professions(
  filter: ProfessionFilter
  sort: ProfessionSort
  limit: Int
  offset: Int
): [Profession!]!
```

**Filtros disponibles:**

```graphql
input ProfessionFilter {
  category: ProfessionCategory
  demandLevel: DemandLevel
  isActive: Boolean
  searchText: String
}
```

**Ejemplo de uso:**

```graphql
query GetTechnologyProfessions {
  professions(
    filter: { category: Technology, isActive: true, demandLevel: High }
    sort: { field: popularity, order: DESC }
    limit: 20
    offset: 0
  ) {
    id
    name
    code
    description
    demandLevel
    registeredProfessionals
    activeJobOffers
    skills
    averageSalaryRange {
      min
      max
      currency
    }
  }
}
```

### 2. profession

Obtiene una profesión específica por ID.

**Sintaxis:**

```graphql
profession(id: ID!): Profession
```

**Ejemplo de uso:**

```graphql
query GetProfession {
  profession(id: "64a7b8c9d0e1f2345678901a") {
    id
    name
    code
    category
    subcategory
    description
    requirements
    skills
    demandLevel
    averageSalaryRange {
      min
      max
      currency
    }
    registeredProfessionals
    activeJobOffers
    popularity
    createdBy
    lastUpdated
  }
}
```

### 3. professionByCode

Obtiene una profesión por su código único.

**Sintaxis:**

```graphql
professionByCode(code: String!): Profession
```

**Ejemplo de uso:**

```graphql
query GetProfessionByCode {
  professionByCode(code: "DEV-FS") {
    id
    name
    description
    category
    skills
    requirements
    demandLevel
  }
}
```

### 4. professionsByCategory

Obtiene profesiones filtradas por categoría.

**Sintaxis:**

```graphql
professionsByCategory(category: ProfessionCategory!): [Profession!]!
```

**Ejemplo de uso:**

```graphql
query GetHealthcareProfessions {
  professionsByCategory(category: Healthcare) {
    id
    name
    subcategory
    demandLevel
    registeredProfessionals
    requirements
    averageSalaryRange {
      min
      max
      currency
    }
  }
}
```

### 5. popularProfessions

Obtiene las profesiones más populares basadas en número de profesionales registrados y ofertas activas.

**Sintaxis:**

```graphql
popularProfessions(limit: Int = 10): [Profession!]!
```

**Ejemplo de uso:**

```graphql
query GetPopularProfessions {
  popularProfessions(limit: 15) {
    id
    name
    category
    popularity
    registeredProfessionals
    activeJobOffers
    demandLevel
    averageSalaryRange {
      min
      max
      currency
    }
  }
}
```

### 6. professionsByDemand

Obtiene profesiones filtradas por nivel de demanda.

**Sintaxis:**

```graphql
professionsByDemand(demandLevel: DemandLevel!): [Profession!]!
```

**Ejemplo de uso:**

```graphql
query GetHighDemandProfessions {
  professionsByDemand(demandLevel: Critical) {
    id
    name
    category
    description
    activeJobOffers
    registeredProfessionals
    skills
    averageSalaryRange {
      min
      max
      currency
    }
  }
}
```

### 7. searchProfessions

Busca profesiones por texto en múltiples campos (nombre, descripción, habilidades, requisitos).

**Sintaxis:**

```graphql
searchProfessions(searchText: String!): [Profession!]!
```

**Ejemplo de uso:**

```graphql
query SearchProfessions {
  searchProfessions(searchText: "desarrollador software") {
    id
    name
    category
    description
    skills
    requirements
    demandLevel
    registeredProfessionals
  }
}
```

### 8. professionStatsByCategory

Obtiene estadísticas agregadas de profesiones por categoría.

**Sintaxis:**

```graphql
professionStatsByCategory: [ProfessionCategoryStats!]!
```

**Ejemplo de uso:**

```graphql
query GetCategoryStatistics {
  professionStatsByCategory {
    category
    count
    totalProfessionals
    totalJobOffers
    averageSalaryMin
    averageSalaryMax
  }
}
```

### 9. professionsCount

Cuenta el número total de profesiones con filtros opcionales.

**Sintaxis:**

```graphql
professionsCount(filter: ProfessionFilter): Int!
```

**Ejemplo de uso:**

```graphql
query CountActiveProfessions {
  professionsCount(filter: { isActive: true })
}

query CountTechnologyProfessions {
  professionsCount(filter: { category: Technology, demandLevel: High })
}
```

---

## Mutations

### 1. createProfession

Crea una nueva profesión en el catálogo.

**Sintaxis:**

```graphql
createProfession(input: ProfessionInput!): Profession!
```

**Input:**

```graphql
input ProfessionInput {
  name: String!
  code: String
  category: ProfessionCategory!
  subcategory: String
  description: String!
  requirements: [String!]
  skills: [String!]
  averageSalaryRange: SalaryRangeInput
  demandLevel: DemandLevel
  isActive: Boolean
}
```

**Ejemplo de uso:**

```graphql
mutation CreateProfession {
  createProfession(
    input: {
      name: "Desarrollador Full-Stack"
      code: "DEV-FS"
      category: Technology
      subcategory: "Desarrollo de Software"
      description: "Profesional especializado en desarrollo tanto frontend como backend"
      requirements: [
        "Título universitario en Ingeniería en Sistemas o afín"
        "Mínimo 2 años de experiencia"
        "Conocimiento en bases de datos"
      ]
      skills: ["JavaScript", "React", "Node.js", "MongoDB", "HTML/CSS", "Git"]
      averageSalaryRange: { min: 800000, max: 1500000, currency: CRC }
      demandLevel: High
      isActive: true
    }
  ) {
    id
    name
    code
    category
    demandLevel
    createdAt
  }
}
```

### 2. updateProfession

Actualiza una profesión existente.

**Sintaxis:**

```graphql
updateProfession(id: ID!, input: ProfessionUpdateInput!): Profession!
```

**Ejemplo de uso:**

```graphql
mutation UpdateProfession {
  updateProfession(
    id: "64a7b8c9d0e1f2345678901a"
    input: {
      description: "Profesional especializado en desarrollo completo de aplicaciones web y móviles"
      demandLevel: Critical
      averageSalaryRange: { min: 900000, max: 1800000, currency: CRC }
      skills: [
        "JavaScript"
        "TypeScript"
        "React"
        "React Native"
        "Node.js"
        "MongoDB"
        "PostgreSQL"
        "Docker"
        "AWS"
      ]
    }
  ) {
    id
    description
    demandLevel
    skills
    averageSalaryRange {
      min
      max
      currency
    }
    lastUpdated
  }
}
```

### 3. deleteProfession

Elimina una profesión (soft delete - marca como inactiva).

**Sintaxis:**

```graphql
deleteProfession(id: ID!): Boolean!
```

**Ejemplo de uso:**

```graphql
mutation DeleteProfession {
  deleteProfession(id: "64a7b8c9d0e1f2345678901a")
}
```

### 4. addProfessionRequirement

Agrega un requisito específico a una profesión.

**Sintaxis:**

```graphql
addProfessionRequirement(id: ID!, requirement: String!): Profession!
```

**Ejemplo de uso:**

```graphql
mutation AddRequirement {
  addProfessionRequirement(
    id: "64a7b8c9d0e1f2345678901a"
    requirement: "Certificación en metodologías ágiles (Scrum, Kanban)"
  ) {
    id
    name
    requirements
    lastUpdated
  }
}
```

### 5. removeProfessionRequirement

Remueve un requisito de una profesión.

**Sintaxis:**

```graphql
removeProfessionRequirement(id: ID!, requirement: String!): Profession!
```

**Ejemplo de uso:**

```graphql
mutation RemoveRequirement {
  removeProfessionRequirement(
    id: "64a7b8c9d0e1f2345678901a"
    requirement: "Mínimo 2 años de experiencia"
  ) {
    id
    requirements
    lastUpdated
  }
}
```

### 6. addProfessionSkill

Agrega una habilidad requerida a una profesión.

**Sintaxis:**

```graphql
addProfessionSkill(id: ID!, skill: String!): Profession!
```

**Ejemplo de uso:**

```graphql
mutation AddSkill {
  addProfessionSkill(id: "64a7b8c9d0e1f2345678901a", skill: "GraphQL") {
    id
    name
    skills
    lastUpdated
  }
}
```

### 7. removeProfessionSkill

Remueve una habilidad de una profesión.

**Sintaxis:**

```graphql
removeProfessionSkill(id: ID!, skill: String!): Profession!
```

**Ejemplo de uso:**

```graphql
mutation RemoveSkill {
  removeProfessionSkill(id: "64a7b8c9d0e1f2345678901a", skill: "jQuery") {
    id
    skills
    lastUpdated
  }
}
```

### 8. updateProfessionStats

Actualiza las estadísticas de una profesión específica (contadores de profesionales y ofertas).

**Sintaxis:**

```graphql
updateProfessionStats(id: ID!): Profession!
```

**Ejemplo de uso:**

```graphql
mutation UpdateStats {
  updateProfessionStats(id: "64a7b8c9d0e1f2345678901a") {
    id
    name
    registeredProfessionals
    activeJobOffers
    popularity
    lastUpdated
  }
}
```

### 9. updateAllProfessionStats

Actualiza las estadísticas de todas las profesiones activas en lote.

**Sintaxis:**

```graphql
updateAllProfessionStats: [Profession!]!
```

**Ejemplo de uso:**

```graphql
mutation UpdateAllStats {
  updateAllProfessionStats {
    id
    name
    registeredProfessionals
    activeJobOffers
    popularity
    lastUpdated
  }
}
```

### 10. toggleProfessionStatus

Cambia el estado activo/inactivo de una profesión.

**Sintaxis:**

```graphql
toggleProfessionStatus(id: ID!): Profession!
```

**Ejemplo de uso:**

```graphql
mutation ToggleProfessionStatus {
  toggleProfessionStatus(id: "64a7b8c9d0e1f2345678901a") {
    id
    name
    isActive
    lastUpdated
  }
}
```

---

## Casos de Uso Comunes

### 1. Creación completa de profesión

```graphql
mutation CreateCompleteProfession {
  createProfession(
    input: {
      name: "Diseñador UX/UI"
      code: "DES-UX"
      category: Arts
      subcategory: "Diseño Digital"
      description: "Profesional especializado en experiencia de usuario y diseño de interfaces digitales"
      requirements: [
        "Título en Diseño Gráfico, Diseño Industrial o carreras afines"
        "Portafolio demostrable de proyectos UX/UI"
        "Conocimiento en metodologías de Design Thinking"
        "Experiencia con herramientas de prototipado"
      ]
      skills: [
        "Figma"
        "Adobe XD"
        "Sketch"
        "InVision"
        "Photoshop"
        "Illustrator"
        "HTML/CSS básico"
        "User Research"
        "Wireframing"
        "Prototyping"
      ]
      averageSalaryRange: { min: 600000, max: 1200000, currency: CRC }
      demandLevel: High
      isActive: true
    }
  ) {
    id
    name
    code
    category
    subcategory
    description
    requirements
    skills
    demandLevel
    averageSalaryRange {
      min
      max
      currency
    }
    isActive
    createdAt
  }
}
```

### 2. Búsqueda avanzada de profesiones

```graphql
query AdvancedProfessionSearch {
  professions(
    filter: {
      category: Technology
      demandLevel: High
      isActive: true
      searchText: "desarrollo"
    }
    sort: { field: popularity, order: DESC }
    limit: 25
  ) {
    id
    name
    code
    description
    subcategory
    registeredProfessionals
    activeJobOffers
    popularity
    skills
    averageSalaryRange {
      min
      max
      currency
    }
  }
}
```

### 3. Dashboard de estadísticas de profesiones

```graphql
query ProfessionsDashboard {
  professionStatsByCategory {
    category
    count
    totalProfessionals
    totalJobOffers
    averageSalaryMin
    averageSalaryMax
  }

  popularProfessions(limit: 10) {
    id
    name
    category
    popularity
    registeredProfessionals
    activeJobOffers
  }

  professionsByDemand(demandLevel: Critical) {
    id
    name
    registeredProfessionals
    activeJobOffers
  }

  professionsCount(filter: { isActive: true })
  professionsCount(filter: { demandLevel: High })
}
```

### 4. Gestión de habilidades y requisitos

```graphql
# Agregar múltiples habilidades
mutation UpdateProfessionSkills($professionId: ID!) {
  addReactSkill: addProfessionSkill(id: $professionId, skill: "React") {
    id
    skills
  }

  addNodeSkill: addProfessionSkill(id: $professionId, skill: "Node.js") {
    id
    skills
  }

  addDockerSkill: addProfessionSkill(id: $professionId, skill: "Docker") {
    id
    skills
    lastUpdated
  }
}
```

### 5. Análisis de mercado laboral

```graphql
query MarketAnalysis {
  technologyProfessions: professionsByCategory(category: Technology) {
    id
    name
    demandLevel
    registeredProfessionals
    activeJobOffers
    averageSalaryRange {
      min
      max
      currency
    }
  }

  highDemandProfessions: professionsByDemand(demandLevel: High) {
    id
    name
    category
    registeredProfessionals
    activeJobOffers
  }

  categoryStats: professionStatsByCategory {
    category
    count
    totalProfessionals
    totalJobOffers
    averageSalaryMin
    averageSalaryMax
  }

  totalActiveProfessions: professionsCount(filter: { isActive: true })
}
```

### 6. Búsqueda por múltiples criterios

```graphql
query MultiCriteriaSearch {
  searchResults: searchProfessions(searchText: "software engineer") {
    id
    name
    category
    description
    skills
    requirements
  }

  categoryResults: professionsByCategory(category: Technology) {
    id
    name
    subcategory
    demandLevel
  }

  demandResults: professionsByDemand(demandLevel: Critical) {
    id
    name
    activeJobOffers
    registeredProfessionals
  }
}
```

### 7. Mantenimiento y actualización masiva

```graphql
mutation BulkProfessionMaintenance {
  # Actualizar estadísticas de todas las profesiones
  updatedProfessions: updateAllProfessionStats {
    id
    name
    registeredProfessionals
    activeJobOffers
    popularity
  }
}
```

---

## Subscriptions

### 1. professionUpdated

Se suscribe a actualizaciones de una profesión específica.

**Sintaxis:**

```graphql
subscription ProfessionUpdates($professionId: ID!) {
  professionUpdated(id: $professionId) {
    id
    name
    registeredProfessionals
    activeJobOffers
    demandLevel
    lastUpdated
  }
}
```

### 2. professionCreated

Se suscribe a nuevas profesiones creadas.

**Sintaxis:**

```graphql
subscription NewProfessions {
  professionCreated {
    id
    name
    category
    demandLevel
    createdAt
  }
}
```

### 3. professionStatsUpdated

Se suscribe a actualizaciones de estadísticas de profesiones.

**Sintaxis:**

```graphql
subscription ProfessionStatsUpdates {
  professionStatsUpdated {
    id
    name
    registeredProfessionals
    activeJobOffers
    popularity
  }
}
```
