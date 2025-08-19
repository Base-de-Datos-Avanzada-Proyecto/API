# Impresiones - Sistema de Reportes GraphQL

Este documento contiene todos los queries GraphQL necesarios para generar los diferentes tipos de impresiones requeridas por el sistema, junto con los inputs de ejemplo para cada consulta.

## 1. Impresión General del Empleador

General employer report showing identification number, name, and job offers.

### Query:

```graphql
query GetEmployersGeneralReport {
  employersGeneralInfo {
    cedula # Employer identification number
    name # Employer name or business name
    jobOffers # Number of job offers published
  }
}
```

---

## 2. Información Específica de un Profesional

Specific professional information including identification, name, and professions.

### Query:

```graphql
query GetProfessionalSpecificInfo($cedula: String!) {
  professionalInfo(cedula: $cedula) {
    cedula # Professional identification number
    name # Full name
    professions # Array of profession names
  }
}
```

### Input:

```json
{
  "cedula": "1-1234-5678"
}
```

---

## 3. Inventario de Plazas o Puestos Vacantes

Inventory of vacant positions and job openings.

### Query:

```graphql
query GetVacantPositionsInventory {
  vacantPositions {
    id # Job offer unique identifier
    title # Position title
    employer # Employer name
    canton # Location canton
    workType # Employment type (Full_time, Part_time, etc.)
    applicationDeadline # Application deadline
    status # Current status (Published, Draft, etc.)
  }
}
```

---

## 4. Profesionales por Área Determinada

List of all professional applicants for a specific professional area/category.

### Query:

```graphql
query GetProfessionalsByArea($professionId: ID!) {
  professionalsByProfession(professionId: $professionId) {
    id
    fullName # Complete professional name
    email # Contact email
    phone # Phone number
    canton # Location
    age # Professional age
    # Professional experience in the area
    professions {
      experienceYears
      proficiencyLevel
      registrationDate
    }

    # Curriculum information
    curriculum {
      summary
      totalWorkExperience
      highestEducation
      isPublic
    }
  }
}
```

### Input:

```json
{
  "professionId": "68a3bee57357a7e08d784809"
}
```

---

## 5. Cantidad y Porcentaje de Profesionales por Área

Count and percentage of registered professionals by professional area/category.

### Query:

```graphql
query GetProfessionalStatsByArea {
  professionalProfessionStats {
    profession {
      name # Profession name
      category # Professional category
    }
    count # Number of professionals in this area
    percentage # Percentage of total professionals
  }
}
```

---

## 6. Cantidad de Profesionales por Género

Count of registered professionals by gender.

### Query:

```graphql
query GetProfessionalStatsByGender {
  professionalGenderStats {
    gender # Male, Female, Other
    count # Number of professionals of this gender
  }
}
```
