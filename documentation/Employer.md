# Employer GraphQL API Documentation

## Descripción General

Este módulo maneja todas las operaciones relacionadas con empleadores en el sistema. Soporta tanto personas físicas como entidades jurídicas y proporciona funcionalidades completas de CRUD y gestión.

## Tipos de Datos

### Employer

```graphql
type Employer {
  id: ID!
  identification: String!
  employerType: EmployerType!
  name: String!
  lastName: String
  legalName: String
  businessSector: String
  email: String!
  phone: String!
  alternativePhone: String
  canton: Canton!
  address: String!
  website: String
  description: String
  expectedHires: Int
  preferredProfessions: [Profession!]!
  isVerified: Boolean!
  isActive: Boolean!
  registrationDate: String!
  lastUpdated: String!
  registrationNumber: String
  createdAt: String!
  updatedAt: String!

  # Campos virtuales
  displayName: String!
  formattedIdentification: String!

  # Datos relacionados
  activeJobOffersCount: Int!
  jobOffers: [JobOffer!]!
}
```

### Enums

- `EmployerType`: fisica, juridica
- `Canton`: Puntarenas, Esparza, MonteDeOro
- `SortOrder`: ASC, DESC

---

## Queries

### 1. employers

Obtiene todos los empleadores con filtros y paginación opcionales.

**Ejemplo de uso:**

```graphql
query GetActiveEmployers {
  employers(
    filter: { isActive: true, canton: Puntarenas }
    sort: { field: name, order: ASC }
    limit: 20
    offset: 0
  ) {
    id
    name
    lastName
    employerType
    email
    isVerified
    activeJobOffersCount
  }
}
```

### 2. employer

Obtiene un empleador específico por ID.

**Ejemplo de uso:**

```graphql
query GetEmployer {
  employer(id: "64a7b8c9d0e1f2345678901a") {
    id
    name
    lastName
    legalName
    email
    phone
    canton
    address
    preferredProfessions {
      id
      name
    }
    jobOffers {
      id
      title
      status
    }
  }
}
```

### 3. employerByIdentification

Busca un empleador por su número de identificación.

**Ejemplo de uso:**

```graphql
query GetEmployerByCedula {
  employerByIdentification(identification: "117890123") {
    id
    name
    lastName
    email
    employerType
    isVerified
  }
}
```

### 4. employersByType

Obtiene empleadores filtrados por tipo (física o jurídica).

**Ejemplo de uso:**

```graphql
query GetLegalEntities {
  employersByType(type: juridica) {
    id
    legalName
    businessSector
    email
    registrationNumber
  }
}
```

### 5. employersByCanton

Obtiene empleadores de un cantón específico.

**Ejemplo de uso:**

```graphql
query GetEmployersByLocation {
  employersByCanton(canton: Esparza) {
    id
    displayName
    address
    phone
    activeJobOffersCount
  }
}
```

### 6. verifiedEmployers

Obtiene todos los empleadores verificados.

**Ejemplo de uso:**

```graphql
query GetVerifiedEmployers {
  verifiedEmployers {
    id
    displayName
    businessSector
    registrationDate
    activeJobOffersCount
  }
}
```

### 7. employerStats

Obtiene estadísticas generales de empleadores.

**Ejemplo de uso:**

```graphql
query GetEmployerStatistics {
  employerStats {
    total
    active
    verified
    fisica
    juridica
  }
}
```

### 8. employersCount

Cuenta el número total de empleadores con filtros opcionales.

**Ejemplo de uso:**

```graphql
query CountActiveEmployers {
  employersCount(filter: { isActive: true, isVerified: true })
}
```

### 9. employersGeneralInfo

Obtiene información general de empleadores para reportes.

**Ejemplo de uso:**

```graphql
query GetEmployersReport {
  employersGeneralInfo {
    cedula
    name
    jobOffers
  }
}
```

### 10. searchEmployers

Busca empleadores por texto en múltiples campos.

**Ejemplo de uso:**

```graphql
query SearchEmployers {
  searchEmployers(searchText: "tecnología") {
    id
    displayName
    businessSector
    email
    activeJobOffersCount
  }
}
```

---

## Mutations

### 1. createEmployer

Crea un nuevo empleador.

**Ejemplo de uso:**

```graphql
mutation CreateEmployer {
  createEmployer(
    input: {
      identification: "117890123"
      employerType: fisica
      name: "Juan"
      lastName: "Pérez"
      email: "juan.perez@email.com"
      phone: "8765-4321"
      canton: Puntarenas
      address: "Centro de Puntarenas"
      businessSector: "Tecnología"
      expectedHires: 5
    }
  ) {
    id
    displayName
    email
    isVerified
    registrationDate
  }
}
```

### 2. updateEmployer

Actualiza un empleador existente.

**Ejemplo de uso:**

```graphql
mutation UpdateEmployer {
  updateEmployer(
    id: "68a2f98b13f394ab705d7a48"
    input: {
      phone: "8765-4321"
      alternativePhone: "2555-1234"
      address: "Nueva dirección en Puntarenas"
      expectedHires: 10
    }
  ) {
    id
    phone
    alternativePhone
    address
    expectedHires
    lastUpdated
  }
}
```

### 3. deleteEmployer

Elimina un empleador (soft delete).

**Ejemplo de uso:**

```graphql
mutation DeleteEmployer {
  deleteEmployer(id: "64a7b8c9d0e1f2345678901a")
}
```

### 4. addPreferredProfession

Agrega una profesión preferida al empleador.

**Ejemplo de uso:**

```graphql
mutation AddPreferredProfession {
  addPreferredProfession(
    employerId: "64a7b8c9d0e1f2345678901a"
    professionId: "64a7b8c9d0e1f2345678901b"
  ) {
    id
    preferredProfessions {
      id
      name
    }
  }
}
```

### 5. removePreferredProfession

Remueve una profesión preferida del empleador.

**Ejemplo de uso:**

```graphql
mutation RemovePreferredProfession {
  removePreferredProfession(
    employerId: "68a24a524e9922180b1aa27c"
    professionId: "68a24a524e9922180b1aa25a"
  ) {
    id
    preferredProfessions {
      id
      name
    }
  }
}
```

### 6. verifyEmployer

Verifica la cuenta de un empleador.

**Ejemplo de uso:**

```graphql
mutation VerifyEmployer {
  verifyEmployer(id: "64a7b8c9d0e1f2345678901a") {
    id
    displayName
    isVerified
    lastUpdated
  }
}
```

### 7. toggleEmployerStatus

Cambia el estado activo/inactivo de un empleador.

**Ejemplo de uso:**

```graphql
mutation ToggleEmployerStatus {
  toggleEmployerStatus(id: "64a7b8c9d0e1f2345678901a") {
    id
    displayName
    isActive
    lastUpdated
  }
}
```

### 8. createEmployers

Crea múltiples empleadores (carga masiva).

**Ejemplo de uso:**

```graphql
mutation BulkCreateEmployers {
  createEmployers(
    input: [
      {
        identification: "1-1789-0122"
        employerType: fisica
        name: "Juan"
        lastName: "Pérez"
        email: "juan@email.com"
        phone: "8765-4321"
        canton: Puntarenas
        address: "Puntarenas Centro"
      }
      {
        identification: "3-101-234511"
        employerType: juridica
        name: "TechCorp"
        legalName: "Corporación Tecnológica S.A."
        email: "info@techcorp.com"
        phone: "2555-1234"
        canton: Esparza
        address: "Esparza Centro"
        businessSector: "Tecnología"
      }
    ]
  ) {
    id
    displayName
    employerType
    isActive
  }
}
```

### 9. updateEmployerContact

Actualiza información de contacto específica del empleador.

**Ejemplo de uso:**

```graphql
mutation UpdateEmployerContact {
  updateEmployerContact(
    id: "64a7b8c9d0e1f2345678901a"
    email: "nuevo.email@empresa.com"
    phone: "8765-1234"
    alternativePhone: "2555-9876"
    address: "Nueva dirección empresarial"
  ) {
    id
    email
    phone
    alternativePhone
    address
    lastUpdated
  }
}
```
