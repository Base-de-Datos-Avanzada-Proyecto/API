/**
 * Data Seed Script
 * ITI-821 Advanced Database Course
 * Professional Registry System - Pacific Region
 * 
 * Seeds the database with initial data for testing and demonstration
 * Includes: Professions, Professionals, Employers, Job Offers, Applications, and Curricula
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Professional = require('./models/Professional');
const Employer = require('./models/Employer');
const Profession = require('./models/Profession');
const JobOffer = require('./models/JobOffer');
const Application = require('./models/Application');
const Curriculum = require('./models/Curriculum');

// Local storage for IDs
const seededData = {
  professions: new Map(),
  employers: new Map(),
  professionals: []
};

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/profesionales_pacifica');
    console.log('✅ Connected to MongoDB for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Clear existing data
 */
const clearData = async () => {
  try {
    console.log('🧹 Clearing existing data...');
    
    await Application.deleteMany({});
    await JobOffer.deleteMany({});
    await Curriculum.deleteMany({});
    await Professional.deleteMany({});
    await Employer.deleteMany({});
    await Profession.deleteMany({});
    
    // Clear local storage
    seededData.professions.clear();
    seededData.employers.clear();
    seededData.professionals = [];
    
    console.log('✅ Data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};


const clearCurriculumPhotos = async () => {
  const db = mongoose.connection.db;

  await Promise.all([
    db.collection('curriculum_photos.files').deleteMany({}),
    db.collection('curriculum_photos.chunks').deleteMany({}),
  ]);
  
  await db.collection('curricula').updateMany({}, { $set: { photos: [] } });

  console.log('🧹 GridFS curriculum_photos limpiado y referencias photos reseteadas');
};



/**
 * Seed Professions - Catalog of available professions
 */
const seedProfessions = async () => {
  try {
    console.log('📋 Seeding professions...');
    
    const professions = [
      // Technology
      {
        name: 'Software Developer',
        code: 'SOFTDEV',
        category: 'Technology',
        subcategory: 'Software Engineering',
        description: 'Design, develop, and maintain software applications and systems using various programming languages and technologies.',
        requirements: [
          'Bachelor\'s degree in Computer Science or related field',
          'Proficiency in at least one programming language',
          'Understanding of software development methodologies'
        ],
        skills: ['JavaScript', 'Python', 'Java', 'Git', 'SQL', 'Problem Solving'],
        averageSalaryRange: { min: 800000, max: 1500000, currency: 'CRC' },
        demandLevel: 'High'
      },
      {
        name: 'Network Administrator',
        code: 'NETADMIN',
        category: 'Technology',
        subcategory: 'Network Infrastructure',
        description: 'Manage and maintain computer networks, ensuring optimal performance and security.',
        requirements: [
          'Technical degree in Computer Networks',
          'Network certifications preferred',
          'Experience with network protocols'
        ],
        skills: ['Cisco', 'Network Security', 'TCP/IP', 'Troubleshooting', 'Firewall Management'],
        averageSalaryRange: { min: 700000, max: 1200000, currency: 'CRC' },
        demandLevel: 'Medium'
      },
      {
        name: 'Database Administrator',
        code: 'DBA',
        category: 'Technology',
        subcategory: 'Database Management',
        description: 'Design, implement, and maintain database systems ensuring data integrity and performance.',
        requirements: [
          'Bachelor\'s degree in Information Systems',
          'Experience with database management systems',
          'Understanding of data modeling'
        ],
        skills: ['SQL', 'MongoDB', 'MySQL', 'PostgreSQL', 'Data Modeling', 'Performance Tuning'],
        averageSalaryRange: { min: 900000, max: 1400000, currency: 'CRC' },
        demandLevel: 'High'
      },
      
      // Engineering
      {
        name: 'Electrical Engineer',
        code: 'ELECENG',
        category: 'Engineering',
        subcategory: 'Electrical Systems',
        description: 'Design, develop, and maintain electrical systems and equipment.',
        requirements: [
          'Bachelor\'s degree in Electrical Engineering',
          'Professional engineering license',
          'Knowledge of electrical codes and standards'
        ],
        skills: ['Circuit Design', 'AutoCAD', 'PLC Programming', 'Electrical Safety', 'Project Management'],
        averageSalaryRange: { min: 1000000, max: 1800000, currency: 'CRC' },
        demandLevel: 'Medium'
      },
      {
        name: 'Civil Engineer',
        code: 'CIVENG',
        category: 'Engineering',
        subcategory: 'Construction',
        description: 'Plan, design, and oversee construction and maintenance of building structures and infrastructure.',
        requirements: [
          'Bachelor\'s degree in Civil Engineering',
          'Professional engineering license',
          'Experience with construction projects'
        ],
        skills: ['AutoCAD', 'Project Management', 'Structural Analysis', 'Construction Management', 'Cost Estimation'],
        averageSalaryRange: { min: 950000, max: 1700000, currency: 'CRC' },
        demandLevel: 'High'
      },
      
      // Healthcare
      {
        name: 'Registered Nurse',
        code: 'RN',
        category: 'Healthcare',
        subcategory: 'Nursing',
        description: 'Provide patient care, administer medications, and support medical procedures.',
        requirements: [
          'Bachelor\'s degree in Nursing',
          'Valid nursing license',
          'CPR certification'
        ],
        skills: ['Patient Care', 'Medical Procedures', 'Communication', 'Critical Thinking', 'Empathy'],
        averageSalaryRange: { min: 600000, max: 1100000, currency: 'CRC' },
        demandLevel: 'Critical'
      },
      
      // Business
      {
        name: 'Accountant',
        code: 'ACCT',
        category: 'Business',
        subcategory: 'Finance',
        description: 'Prepare and examine financial records, ensure compliance with regulations.',
        requirements: [
          'Bachelor\'s degree in Accounting',
          'CPA certification preferred',
          'Knowledge of tax regulations'
        ],
        skills: ['Financial Analysis', 'Tax Preparation', 'Excel', 'QuickBooks', 'Attention to Detail'],
        averageSalaryRange: { min: 550000, max: 1000000, currency: 'CRC' },
        demandLevel: 'Medium'
      },
      {
        name: 'Human Resources Specialist',
        code: 'HRSPEC',
        category: 'Business',
        subcategory: 'Human Resources',
        description: 'Manage recruitment, employee relations, and HR policies implementation.',
        requirements: [
          'Bachelor\'s degree in Human Resources',
          'Knowledge of labor laws',
          'Strong interpersonal skills'
        ],
        skills: ['Recruitment', 'Employee Relations', 'Communication', 'Conflict Resolution', 'HR Software'],
        averageSalaryRange: { min: 500000, max: 900000, currency: 'CRC' },
        demandLevel: 'Medium'
      },
      
      // Services
      {
        name: 'Electrician',
        code: 'ELECT',
        category: 'Services',
        subcategory: 'Electrical Services',
        description: 'Install, maintain, and repair electrical wiring, equipment, and fixtures.',
        requirements: [
          'Technical certification in Electrical Work',
          'Valid electrician license',
          'Safety training certification'
        ],
        skills: ['Electrical Installation', 'Troubleshooting', 'Safety Procedures', 'Blueprint Reading', 'Hand Tools'],
        averageSalaryRange: { min: 400000, max: 800000, currency: 'CRC' },
        demandLevel: 'High'
      },
      {
        name: 'Plumber',
        code: 'PLUMB',
        category: 'Services',
        subcategory: 'Plumbing Services',
        description: 'Install and repair piping systems, fixtures, and plumbing equipment.',
        requirements: [
          'Technical certification in Plumbing',
          'Valid plumber license',
          'Physical fitness'
        ],
        skills: ['Pipe Installation', 'Leak Detection', 'Problem Solving', 'Customer Service', 'Hand Tools'],
        averageSalaryRange: { min: 350000, max: 700000, currency: 'CRC' },
        demandLevel: 'Medium'
      }
    ];
    
    const createdProfessions = await Profession.insertMany(professions);
    
    // Store profession IDs by code for easy access
    createdProfessions.forEach(profession => {
      seededData.professions.set(profession.code, profession._id);
    });
    
    console.log(`✅ Created ${createdProfessions.length} professions`);
    return createdProfessions;
  } catch (error) {
    console.error('❌ Error seeding professions:', error);
    throw error;
  }
};

/**
 * Seed Professionals
 */
const seedProfessionals = async () => {
  try {
    console.log('👥 Seeding professionals...');
    
    const professionals = [
      {
        cedula: '1-1234-5678',
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@email.com',
        phone: '2661-2345',
        canton: 'Puntarenas',
        address: 'Barrio El Carmen, Casa 123',
        birthDate: new Date('1990-03-15'),
        gender: 'Female'
      },
      {
        cedula: '2-2345-6789',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@email.com',
        phone: '2639-3456',
        canton: 'Esparza',
        address: 'Centro de Esparza, Avenida 2',
        birthDate: new Date('1988-07-22'),
        gender: 'Male'
      },
      {
        cedula: '1-3456-7890',
        firstName: 'Ana',
        lastName: 'Martínez',
        email: 'ana.martinez@email.com',
        phone: '2661-4567',
        canton: 'Puntarenas',
        address: 'Cocal, 200m sur de la escuela',
        birthDate: new Date('1992-11-08'),
        gender: 'Female'
      },
      {
        cedula: '3-4567-8901',
        firstName: 'José',
        lastName: 'Hernández',
        email: 'jose.hernandez@email.com',
        phone: '2639-5678',
        canton: 'MonteDeOro',
        address: 'Miramar, frente al parque',
        birthDate: new Date('1985-05-12'),
        gender: 'Male'
      },
      {
        cedula: '1-5678-9012',
        firstName: 'Sofía',
        lastName: 'López',
        email: 'sofia.lopez@email.com',
        phone: '2661-6789',
        canton: 'Puntarenas',
        address: 'Barranca, contiguo al hospital',
        birthDate: new Date('1991-09-03'),
        gender: 'Female'
      },
      {
        cedula: '2-6789-0123',
        firstName: 'Miguel',
        lastName: 'Vargas',
        email: 'miguel.vargas@email.com',
        phone: '2639-7890',
        canton: 'Esparza',
        address: 'San Rafael, 100m oeste del banco',
        birthDate: new Date('1987-12-18'),
        gender: 'Male'
      },
      {
        cedula: '1-7890-1234',
        firstName: 'Lucía',
        lastName: 'Jiménez',
        email: 'lucia.jimenez@email.com',
        phone: '2661-8901',
        canton: 'Puntarenas',
        address: 'Chacarita, detrás de la iglesia',
        birthDate: new Date('1993-04-27'),
        gender: 'Female'
      },
      {
        cedula: '3-8901-2345',
        firstName: 'Roberto',
        lastName: 'Morales',
        email: 'roberto.morales@email.com',
        phone: '2639-9012',
        canton: 'MonteDeOro',
        address: 'Aranjuez, casa esquinera',
        birthDate: new Date('1986-08-14'),
        gender: 'Male'
      },
      {
        cedula: '1-9012-3456',
        firstName: 'Carmen',
        lastName: 'Rojas',
        email: 'carmen.rojas@email.com',
        phone: '2661-0123',
        canton: 'Puntarenas',
        address: 'Puntarenas Centro, Avenida Central',
        birthDate: new Date('1989-01-30'),
        gender: 'Female'
      },
      {
        cedula: '2-0123-4567',
        firstName: 'Fernando',
        lastName: 'Castro',
        email: 'fernando.castro@email.com',
        phone: '2639-1234',
        canton: 'Esparza',
        address: 'Espíritu Santo, 500m sur del colegio',
        birthDate: new Date('1984-10-05'),
        gender: 'Male'
      }
    ];
    
    const createdProfessionals = await Professional.insertMany(professionals);
    
    // Store professionals for later use
    seededData.professionals = createdProfessionals;
    
    console.log(`✅ Created ${createdProfessionals.length} professionals`);
    return createdProfessionals;
  } catch (error) {
    console.error('❌ Error seeding professionals:', error);
    throw error;
  }
};

/**
 * Seed Employers
 */
const seedEmployers = async () => {
  try {
    console.log('🏢 Seeding employers...');
    
    const employers = [
      // Legal entities (empresas)
      {
        identification: '3-101-123456',
        employerType: 'juridica',
        name: 'TechSolutions Pacific',
        legalName: 'Soluciones Tecnológicas del Pacífico S.A.',
        businessSector: 'Technology',
        email: 'rrhh@techsolutions.cr',
        phone: '2661-1000',
        canton: 'Puntarenas',
        address: 'Edificio Plaza del Pacífico, Piso 3',
        website: 'https://techsolutions.cr',
        description: 'Leading technology company providing software solutions',
        expectedHires: 15,
        registrationNumber: 'REG-001-2023'
      },
      {
        identification: '3-101-234567',
        employerType: 'juridica',
        name: 'Constructora Esparza',
        legalName: 'Constructora y Desarrollos Esparza Ltda.',
        businessSector: 'Construction',
        email: 'empleos@constructoraesparza.com',
        phone: '2639-2000',
        canton: 'Esparza',
        address: 'Zona Industrial de Esparza, Bodega 12',
        website: 'https://constructoraesparza.com',
        description: 'Construction company specializing in residential and commercial projects',
        expectedHires: 25,
        registrationNumber: 'REG-002-2023'
      },
      {
        identification: '3-101-345678',
        employerType: 'juridica',
        name: 'Clínica del Pacífico',
        legalName: 'Centro Médico del Pacífico S.A.',
        businessSector: 'Healthcare',
        email: 'recursos.humanos@clinicapacifico.cr',
        phone: '2661-3000',
        canton: 'Puntarenas',
        address: 'Avenida 3, Calle 5, Puntarenas Centro',
        website: 'https://clinicapacifico.cr',
        description: 'Private healthcare facility serving the Pacific region',
        expectedHires: 12,
        registrationNumber: 'REG-003-2023'
      },
      {
        identification: '3-101-456789',
        employerType: 'juridica',
        name: 'Servicios Eléctricos MdO',
        legalName: 'Servicios Eléctricos Monte de Oro S.A.',
        businessSector: 'Services',
        email: 'contratacion@electricosmdo.cr',
        phone: '2639-4000',
        canton: 'MonteDeOro',
        address: 'Miramar Centro, Plaza Comercial Local 8',
        description: 'Electrical services for residential and commercial clients',
        expectedHires: 8,
        registrationNumber: 'REG-004-2023'
      },
      
      // Individual employers (personas físicas)
      {
        identification: '1-1111-2222',
        employerType: 'fisica',
        name: 'Luis',
        lastName: 'Fernández',
        businessSector: 'Services',
        email: 'luis.fernandez.empleador@email.com',
        phone: '2661-5000',
        canton: 'Puntarenas',
        address: 'Residencial Los Almendros, Casa 45',
        description: 'Independent contractor for home improvement services',
        expectedHires: 3
      },
      {
        identification: '2-2222-3333',
        employerType: 'fisica',
        name: 'Elena',
        lastName: 'Quesada',
        businessSector: 'Business',
        email: 'elena.quesada.cpa@email.com',
        phone: '2639-6000',
        canton: 'Esparza',
        address: 'Barrio San Antonio, 200m este del banco',
        description: 'Independent CPA offering accounting services',
        expectedHires: 2
      },
      {
        identification: '3-3333-4444',
        employerType: 'fisica',
        name: 'Mario',
        lastName: 'Solano',
        businessSector: 'Technology',
        email: 'mario.solano.dev@email.com',
        phone: '2639-7000',
        canton: 'MonteDeOro',
        address: 'Miramar, Urbanización Vista al Mar',
        description: 'Freelance software developer and consultant',
        expectedHires: 4
      }
    ];
    
    const createdEmployers = await Employer.insertMany(employers);
    
    // Store employer IDs by name for easy access
    createdEmployers.forEach(employer => {
      const key = employer.employerType === 'juridica' ? employer.name : `${employer.name} ${employer.lastName}`;
      seededData.employers.set(key, employer._id);
    });
    
    console.log(`✅ Created ${createdEmployers.length} employers`);
    return createdEmployers;
  } catch (error) {
    console.error('❌ Error seeding employers:', error);
    throw error;
  }
};

/**
 * Seed Curricula for Professionals
 */
const seedCurricula = async (professionals, professions) => {
  try {
    console.log('📄 Seeding curricula...');
    
    const curricula = [];
    
    // Create curriculum for each professional
    for (let i = 0; i < professionals.length; i++) {
      const professional = professionals[i];
      const curriculum = {
        professionalId: professional._id,
        professions: [],
        education: [],
        workExperience: [],
        certifications: [],
        skills: [],
        languages: [
          { language: 'Spanish', proficiency: 'Native' },
          { language: 'English', proficiency: 'Conversational' }
        ],
        summary: '',
        objectives: '',
        isComplete: true,
        isPublic: true
      };
      
      // Assign professions based on professional's background
      switch (i % 5) {
        case 0: // Technology professionals
          curriculum.professions = [
            { 
              professionId: seededData.professions.get('SOFTDEV'),
              experienceYears: 3,
              proficiencyLevel: 'Advanced'
            },
            {
              professionId: seededData.professions.get('DBA'),
              experienceYears: 2,
              proficiencyLevel: 'Intermediate'
            }
          ];
          curriculum.education = [{
            institution: 'Universidad Técnica Nacional',
            degree: 'Ingeniería en Tecnologías de Información',
            fieldOfStudy: 'Computer Science',
            educationLevel: 'Bachelor',
            startDate: new Date('2016-01-01'),
            endDate: new Date('2020-12-01'),
            isCompleted: true,
            gpa: 85
          }];
          curriculum.workExperience = [{
            company: 'Software Solutions CR',
            position: 'Junior Developer',
            startDate: new Date('2021-01-01'),
            endDate: new Date('2023-12-31'),
            isCurrentJob: false,
            description: 'Developed web applications using JavaScript and Python',
            skills: ['JavaScript', 'Python', 'React', 'Node.js']
          }];
          curriculum.skills = [
            { name: 'JavaScript', category: 'Technical', proficiencyLevel: 'Advanced', yearsOfExperience: 3 },
            { name: 'Python', category: 'Technical', proficiencyLevel: 'Intermediate', yearsOfExperience: 2 },
            { name: 'SQL', category: 'Technical', proficiencyLevel: 'Intermediate', yearsOfExperience: 2 }
          ];
          curriculum.summary = 'Software developer with 3 years of experience in web development and database management.';
          break;
          
        case 1: // Engineering professionals
          curriculum.professions = [
            {
              professionId: seededData.professions.get('CIVENG'),
              experienceYears: 5,
              proficiencyLevel: 'Expert'
            }
          ];
          curriculum.education = [{
            institution: 'Universidad de Costa Rica',
            degree: 'Ingeniería Civil',
            fieldOfStudy: 'Civil Engineering',
            educationLevel: 'Bachelor',
            startDate: new Date('2014-01-01'),
            endDate: new Date('2018-12-01'),
            isCompleted: true,
            gpa: 88
          }];
          curriculum.workExperience = [{
            company: 'Constructora Nacional',
            position: 'Project Engineer',
            startDate: new Date('2019-01-01'),
            endDate: new Date('2024-08-01'),
            isCurrentJob: true,
            description: 'Managing construction projects and supervising teams',
            skills: ['AutoCAD', 'Project Management', 'Structural Analysis']
          }];
          curriculum.skills = [
            { name: 'AutoCAD', category: 'Technical', proficiencyLevel: 'Expert', yearsOfExperience: 5 },
            { name: 'Project Management', category: 'Soft', proficiencyLevel: 'Advanced', yearsOfExperience: 4 }
          ];
          curriculum.summary = 'Civil engineer with extensive experience in construction project management.';
          break;
          
        case 2: // Healthcare professionals
          curriculum.professions = [
            {
              professionId: seededData.professions.get('RN'),
              experienceYears: 4,
              proficiencyLevel: 'Advanced'
            }
          ];
          curriculum.education = [{
            institution: 'Universidad Santa Paula',
            degree: 'Licenciatura en Enfermería',
            fieldOfStudy: 'Nursing',
            educationLevel: 'Bachelor',
            startDate: new Date('2015-01-01'),
            endDate: new Date('2019-12-01'),
            isCompleted: true,
            gpa: 90
          }];
          curriculum.certifications = [{
            name: 'Advanced Cardiac Life Support (ACLS)',
            issuingOrganization: 'American Heart Association',
            issueDate: new Date('2022-01-01'),
            expirationDate: new Date('2025-01-01'),
            isActive: true
          }];
          curriculum.summary = 'Registered nurse with specialization in cardiac care and emergency medicine.';
          break;
          
        case 3: // Services professionals
          curriculum.professions = [
            {
              professionId: seededData.professions.get('ELECT'),
              experienceYears: 6,
              proficiencyLevel: 'Expert'
            },
            {
              professionId: seededData.professions.get('PLUMB'),
              experienceYears: 2,
              proficiencyLevel: 'Intermediate'
            }
          ];
          curriculum.education = [{
            institution: 'Instituto Nacional de Aprendizaje (INA)',
            degree: 'Técnico en Electricidad',
            fieldOfStudy: 'Electrical Technology',
            educationLevel: 'Technical',
            startDate: new Date('2017-01-01'),
            endDate: new Date('2018-12-01'),
            isCompleted: true
          }];
          curriculum.skills = [
            { name: 'Electrical Installation', category: 'Technical', proficiencyLevel: 'Expert', yearsOfExperience: 6 },
            { name: 'Safety Procedures', category: 'Technical', proficiencyLevel: 'Advanced', yearsOfExperience: 6 }
          ];
          curriculum.summary = 'Licensed electrician with expertise in residential and commercial installations.';
          break;
          
        case 4: // Business professionals
          curriculum.professions = [
            {
              professionId: seededData.professions.get('ACCT'),
              experienceYears: 4,
              proficiencyLevel: 'Advanced'
            }
          ];
          curriculum.education = [{
            institution: 'Universidad Latina',
            degree: 'Licenciatura en Contabilidad',
            fieldOfStudy: 'Accounting',
            educationLevel: 'Bachelor',
            startDate: new Date('2016-01-01'),
            endDate: new Date('2020-12-01'),
            isCompleted: true,
            gpa: 87
          }];
          curriculum.skills = [
            { name: 'Financial Analysis', category: 'Technical', proficiencyLevel: 'Advanced', yearsOfExperience: 4 },
            { name: 'Excel', category: 'Tool', proficiencyLevel: 'Expert', yearsOfExperience: 5 }
          ];
          curriculum.summary = 'Certified accountant with experience in financial analysis and tax preparation.';
          break;
      }
      
      curricula.push(curriculum);
    }
    
    const createdCurricula = await Curriculum.insertMany(curricula);
    console.log(`✅ Created ${createdCurricula.length} curricula`);
    
    // Update professionals' profileCompleted status
    await Professional.updateMany({}, { profileCompleted: true });
    
    return createdCurricula;
  } catch (error) {
    console.error('❌ Error seeding curricula:', error);
    throw error;
  }
};

/**
 * Seed Job Offers
 */
const seedJobOffers = async () => {
  try {
    console.log('💼 Seeding job offers...');
    
    const jobOffers = [
      {
        title: 'Senior Software Developer',
        description: 'Join our team as a Senior Software Developer. You will be responsible for developing web applications, mentoring junior developers, and participating in architectural decisions. We offer competitive salary, flexible schedule, and growth opportunities.',
        employerId: seededData.employers.get('TechSolutions Pacific'),
        requiredProfessions: [
          seededData.professions.get('SOFTDEV')
        ],
        workType: 'Full_time',
        workModality: 'Hybrid',
        location: {
          canton: 'Puntarenas',
          specificLocation: 'Edificio Plaza del Pacífico'
        },
        salary: {
          min: 1200000,
          max: 1800000,
          currency: 'CRC',
          isNegotiable: true
        },
        requirements: [
          'Minimum 3 years of software development experience',
          'Proficiency in JavaScript and Python',
          'Experience with databases and SQL',
          'Bachelor\'s degree in Computer Science or related field'
        ],
        preferredSkills: ['React', 'Node.js', 'MongoDB', 'Git'],
        experienceRequired: 3,
        educationLevel: 'Bachelor',
        applicationDeadline: new Date('2025-09-30'),
        maxApplications: 20,
        status: 'Published',
        isActive: true,
        publishedAt: new Date('2025-08-01'),
        contactEmail: 'rrhh@techsolutions.cr',
        contactPhone: '2661-1000'
      },
      {
        title: 'Database Administrator',
        description: 'We are looking for an experienced Database Administrator to manage our database systems, ensure optimal performance, and maintain data security.',
        employerId: seededData.employers.get('TechSolutions Pacific'),
        requiredProfessions: [
          seededData.professions.get('DBA')
        ],
        workType: 'Full_time',
        workModality: 'On_site',
        location: {
          canton: 'Puntarenas',
          specificLocation: 'Edificio Plaza del Pacífico'
        },
        salary: {
          min: 1000000,
          max: 1500000,
          currency: 'CRC',
          isNegotiable: false
        },
        requirements: [
          'Minimum 2 years of database administration experience',
          'Proficiency in SQL and NoSQL databases',
          'Experience with MongoDB, MySQL, or PostgreSQL',
          'Bachelor\'s degree preferred'
        ],
        preferredSkills: ['MongoDB', 'Performance Tuning', 'Backup & Recovery'],
        experienceRequired: 2,
        educationLevel: 'Bachelor',
        applicationDeadline: new Date('2025-09-15'),
        maxApplications: 15,
        status: 'Published',
        isActive: true,
        publishedAt: new Date('2025-08-05'),
        contactEmail: 'rrhh@techsolutions.cr'
      },
      {
        title: 'Civil Engineer - Construction Projects',
        description: 'Lead construction projects from planning to completion. Responsible for project management, quality control, and team coordination. Excellent opportunity for career growth in a established construction company.',
        employerId: seededData.employers.get('Constructora Esparza'),
        requiredProfessions: [
          seededData.professions.get('CIVENG')
        ],
        workType: 'Full_time',
        workModality: 'On_site',
        location: {
          canton: 'Esparza',
          specificLocation: 'Zona Industrial de Esparza'
        },
        salary: {
          min: 1100000,
          max: 1600000,
          currency: 'CRC',
          isNegotiable: true
        },
        requirements: [
          'Bachelor\'s degree in Civil Engineering',
          'Minimum 3 years of construction experience',
          'Professional engineering license',
          'Project management experience'
        ],
        preferredSkills: ['AutoCAD', 'MS Project', 'Construction Management', 'Cost Estimation'],
        experienceRequired: 3,
        educationLevel: 'Bachelor',
        applicationDeadline: new Date('2025-10-15'),
        maxApplications: 25,
        status: 'Published',
        isActive: true,
        publishedAt: new Date('2025-08-10'),
        contactEmail: 'empleos@constructoraesparza.com',
        contactPhone: '2639-2000'
      },
      {
        title: 'Registered Nurse - Emergency Department',
        description: 'Join our emergency department team. Provide critical care to patients, work in fast-paced environment, and collaborate with medical staff. Competitive benefits package included.',
        employerId: seededData.employers.get('Clínica del Pacífico'),
        requiredProfessions: [
          seededData.professions.get('RN')
        ],
        workType: 'Full_time',
        workModality: 'On_site',
        location: {
          canton: 'Puntarenas',
          specificLocation: 'Centro Médico del Pacífico'
        },
        salary: {
          min: 800000,
          max: 1200000,
          currency: 'CRC',
          isNegotiable: false
        },
        requirements: [
          'Valid nursing license in Costa Rica',
          'Minimum 2 years of nursing experience',
          'Emergency care certification preferred',
          'CPR certification required'
        ],
        preferredSkills: ['Emergency Care', 'Critical Thinking', 'Patient Assessment', 'IV Therapy'],
        experienceRequired: 2,
        educationLevel: 'Bachelor',
        applicationDeadline: new Date('2025-09-20'),
        maxApplications: 10,
        status: 'Published',
        isActive: true,
        publishedAt: new Date('2025-08-12'),
        contactEmail: 'recursos.humanos@clinicapacifico.cr',
        contactPhone: '2661-3000'
      },
      {
        title: 'Master Electrician',
        description: 'Lead electrical installation projects for residential and commercial clients. Supervise apprentice electricians and ensure compliance with electrical codes.',
        employerId: seededData.employers.get('Servicios Eléctricos MdO'),
        requiredProfessions: [
          seededData.professions.get('ELECT')
        ],
        workType: 'Full_time',
        workModality: 'On_site',
        location: {
          canton: 'MonteDeOro',
          specificLocation: 'Various client locations'
        },
        salary: {
          min: 600000,
          max: 1000000,
          currency: 'CRC',
          isNegotiable: true
        },
        requirements: [
          'Valid electrician license',
          'Minimum 5 years of electrical experience',
          'Leadership and supervisory skills',
          'Knowledge of electrical codes and safety standards'
        ],
        preferredSkills: ['Industrial Electrical', 'PLC Programming', 'Team Leadership', 'Blueprint Reading'],
        experienceRequired: 5,
        educationLevel: 'Technical',
        applicationDeadline: new Date('2025-10-01'),
        maxApplications: 8,
        status: 'Published',
        isActive: true,
        publishedAt: new Date('2025-08-15'),
        contactEmail: 'contratacion@electricosmdo.cr',
        contactPhone: '2639-4000'
      },
      {
        title: 'Junior Software Developer',
        description: 'Entry-level position for recent graduates. Learn from experienced developers while contributing to exciting projects. Great opportunity to start your tech career.',
        employerId: seededData.employers.get('Mario Solano'),
        requiredProfessions: [
          seededData.professions.get('SOFTDEV')
        ],
        workType: 'Part_time',
        workModality: 'Remote',
        location: {
          canton: 'MonteDeOro',
          specificLocation: 'Remote work available'
        },
        salary: {
          min: 400000,
          max: 700000,
          currency: 'CRC',
          isNegotiable: true
        },
        requirements: [
          'Bachelor\'s degree in Computer Science or related field',
          'Knowledge of at least one programming language',
          'Willingness to learn and grow',
          'Good communication skills'
        ],
        preferredSkills: ['JavaScript', 'Python', 'Git', 'Problem Solving'],
        experienceRequired: 0,
        educationLevel: 'Bachelor',
        applicationDeadline: new Date('2025-09-25'),
        maxApplications: 12,
        status: 'Published',
        isActive: true,
        publishedAt: new Date('2025-08-18'),
        contactEmail: 'mario.solano.dev@email.com',
        contactPhone: '2639-7000'
      },
      {
        title: 'Accounting Assistant',
        description: 'Support senior accountant with bookkeeping, tax preparation, and financial record maintenance. Ideal for someone starting their accounting career.',
        employerId: seededData.employers.get('Elena Quesada'),
        requiredProfessions: [
          seededData.professions.get('ACCT')
        ],
        workType: 'Part_time',
        workModality: 'On_site',
        location: {
          canton: 'Esparza',
          specificLocation: 'Home office in Esparza'
        },
        salary: {
          min: 300000,
          max: 500000,
          currency: 'CRC',
          isNegotiable: false
        },
        requirements: [
          'Bachelor\'s degree in Accounting or related field',
          'Basic knowledge of accounting principles',
          'Proficiency in Excel',
          'Attention to detail'
        ],
        preferredSkills: ['QuickBooks', 'Tax Knowledge', 'Excel', 'Communication'],
        experienceRequired: 0,
        educationLevel: 'Bachelor',
        applicationDeadline: new Date('2025-09-10'),
        maxApplications: 5,
        status: 'Published',
        isActive: true,
        publishedAt: new Date('2025-08-20'),
        contactEmail: 'elena.quesada.cpa@email.com',
        contactPhone: '2639-6000'
      },
      {
        title: 'Residential Electrician',
        description: 'Perform electrical installations and repairs in residential properties. Must be reliable, punctual, and have excellent customer service skills.',
        employerId: seededData.employers.get('Luis Fernández'),
        requiredProfessions: [
          seededData.professions.get('ELECT')
        ],
        workType: 'Contract',
        workModality: 'On_site',
        location: {
          canton: 'Puntarenas',
          specificLocation: 'Various residential locations'
        },
        salary: {
          min: 350000,
          max: 600000,
          currency: 'CRC',
          isNegotiable: true
        },
        requirements: [
          'Valid electrician license',
          'Minimum 2 years of residential electrical experience',
          'Own transportation and basic tools',
          'Customer service skills'
        ],
        preferredSkills: ['Residential Wiring', 'Troubleshooting', 'Customer Service', 'Time Management'],
        experienceRequired: 2,
        educationLevel: 'Technical',
        applicationDeadline: new Date('2025-09-05'),
        maxApplications: 3,
        status: 'Published',
        isActive: true,
        publishedAt: new Date('2025-08-22'),
        contactEmail: 'luis.fernandez.empleador@email.com',
        contactPhone: '2661-5000'
      }
    ];
    
    const createdJobOffers = await JobOffer.insertMany(jobOffers);
    console.log(`✅ Created ${createdJobOffers.length} job offers`);
    
    return createdJobOffers;
  } catch (error) {
    console.error('❌ Error seeding job offers:', error);
    throw error;
  }
};

/**
 * Seed Job Applications
 */
const seedApplications = async (jobOffers) => {
  try {
    console.log('📋 Seeding job applications...');
    
    const applications = [];
    const professionals = seededData.professionals;
    
    // Create applications ensuring monthly limit (3 per professional per month)
    // and no duplicate applications to same job offer
    
    const currentDate = new Date();
    const lastMonth = new Date(currentDate);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Professional 0 (María González - Software Developer) applies to tech jobs
    const maria = professionals[0];
    const techJobs = jobOffers.filter(job => 
      job.title.toLowerCase().includes('software') || 
      job.title.toLowerCase().includes('database')
    );
    
    if (techJobs.length >= 2) {
      applications.push({
        professionalId: maria._id,
        jobOfferId: techJobs[0]._id,
        status: 'Pending',
        coverLetter: 'I am very interested in this software developer position. My experience with JavaScript and Python makes me a great fit for your team.',
        motivation: 'I want to grow my career in software development and contribute to innovative projects.',
        expectedSalary: {
          amount: 1400000,
          currency: 'CRC',
          isNegotiable: true
        },
        availabilityDate: new Date('2025-09-01'),
        additionalSkills: ['React', 'Node.js', 'MongoDB'],
        appliedAt: new Date('2025-08-10'),
        priority: 'High'
      });
      
      applications.push({
        professionalId: maria._id,
        jobOfferId: techJobs[1]._id,
        status: 'Accepted',
        coverLetter: 'As a database enthusiast, I am excited about the DBA position at your company.',
        motivation: 'Database management is my passion and I want to specialize further.',
        expectedSalary: {
          amount: 1200000,
          currency: 'CRC',
          isNegotiable: false
        },
        availabilityDate: new Date('2025-09-15'),
        additionalSkills: ['Performance Tuning', 'Backup Strategies'],
        appliedAt: new Date('2025-08-08'),
        reviewedAt: new Date('2025-08-15'),
        reviewedBy: techJobs[1].employerId,
        priority: 'High'
      });
    }
    
    // Professional 1 (Carlos Rodríguez - Civil Engineer) applies to construction job
    const carlos = professionals[1];
    const constructionJobs = jobOffers.filter(job => 
      job.title.toLowerCase().includes('civil') || 
      job.title.toLowerCase().includes('construction')
    );
    
    if (constructionJobs.length >= 1) {
      applications.push({
        professionalId: carlos._id,
        jobOfferId: constructionJobs[0]._id,
        status: 'Pending',
        coverLetter: 'With 5 years of experience in construction project management, I am confident I can contribute to your team\'s success.',
        motivation: 'I want to take on larger projects and lead construction teams.',
        expectedSalary: {
          amount: 1500000,
          currency: 'CRC',
          isNegotiable: true
        },
        availabilityDate: new Date('2025-09-01'),
        additionalSkills: ['Team Leadership', 'Quality Control', 'Cost Management'],
        appliedAt: new Date('2025-08-12'),
        priority: 'Medium'
      });
    }
    
    // Professional 2 (Ana Martínez - Nurse) applies to healthcare job
    const ana = professionals[2];
    const healthcareJobs = jobOffers.filter(job => 
      job.title.toLowerCase().includes('nurse') || 
      job.title.toLowerCase().includes('healthcare')
    );
    
    if (healthcareJobs.length >= 1) {
      applications.push({
        professionalId: ana._id,
        jobOfferId: healthcareJobs[0]._id,
        status: 'Rejected',
        coverLetter: 'I am passionate about emergency medicine and have the skills necessary for this demanding role.',
        motivation: 'Emergency nursing is my calling and I want to help save lives.',
        expectedSalary: {
          amount: 1000000,
          currency: 'CRC',
          isNegotiable: false
        },
        availabilityDate: new Date('2025-09-25'),
        additionalSkills: ['ACLS Certified', 'Trauma Care', 'IV Therapy'],
        appliedAt: new Date('2025-08-05'),
        reviewedAt: new Date('2025-08-18'),
        reviewedBy: healthcareJobs[0].employerId,
        notes: 'Great candidate but position filled by internal candidate',
        priority: 'Medium'
      });
    }
    
    // Professional 3 (José Hernández - Electrician) applies to electrical jobs
    const jose = professionals[3];
    const electricalJobs = jobOffers.filter(job => 
      job.title.toLowerCase().includes('electric')
    );
    
    if (electricalJobs.length >= 2) {
      applications.push({
        professionalId: jose._id,
        jobOfferId: electricalJobs[0]._id,
        status: 'Pending',
        coverLetter: 'With 6 years of electrical experience, I am ready to take on a master electrician role.',
        motivation: 'I want to advance my career and mentor younger electricians.',
        expectedSalary: {
          amount: 800000,
          currency: 'CRC',
          isNegotiable: true
        },
        availabilityDate: new Date('2025-09-01'),
        additionalSkills: ['Industrial Systems', 'Safety Training', 'Team Leadership'],
        appliedAt: new Date('2025-08-16'),
        priority: 'High'
      });
      
      applications.push({
        professionalId: jose._id,
        jobOfferId: electricalJobs[1]._id,
        status: 'Pending',
        coverLetter: 'I have extensive residential electrical experience and excellent customer service skills.',
        motivation: 'I enjoy working directly with homeowners and solving electrical problems.',
        expectedSalary: {
          amount: 500000,
          currency: 'CRC',
          isNegotiable: true
        },
        availabilityDate: new Date('2025-09-30'),
        additionalSkills: ['Customer Relations', 'Problem Solving', 'Quality Work'],
        appliedAt: new Date('2025-08-20'),
        priority: 'Medium'
      });
    }
    
    // Professional 4 (Sofía López) applies to junior dev position
    const sofia = professionals[4];
    const juniorDevJobs = jobOffers.filter(job => 
      job.title.toLowerCase().includes('junior')
    );
    
    if (juniorDevJobs.length >= 1) {
      applications.push({
        professionalId: sofia._id,
        jobOfferId: juniorDevJobs[0]._id,
        status: 'Accepted',
        coverLetter: 'As a recent graduate, I am eager to start my career in software development.',
        motivation: 'I want to learn from experienced developers and contribute to meaningful projects.',
        expectedSalary: {
          amount: 600000,
          currency: 'CRC',
          isNegotiable: true
        },
        availabilityDate: new Date('2025-09-28'),
        additionalSkills: ['Quick Learner', 'Team Player', 'Fresh Perspective'],
        appliedAt: new Date('2025-08-19'),
        reviewedAt: new Date('2025-08-21'),
        reviewedBy: juniorDevJobs[0].employerId,
        priority: 'High'
      });
    }
    
    // Professional 5 (Miguel Vargas - Accountant) applies to accounting job
    const miguel = professionals[5];
    const accountingJobs = jobOffers.filter(job => 
      job.title.toLowerCase().includes('accounting')
    );
    
    if (accountingJobs.length >= 1) {
      applications.push({
        professionalId: miguel._id,
        jobOfferId: accountingJobs[0]._id,
        status: 'Pending',
        coverLetter: 'My accounting background and attention to detail make me perfect for this assistant role.',
        motivation: 'I want to gain experience in a smaller firm and learn from experienced professionals.',
        expectedSalary: {
          amount: 450000,
          currency: 'CRC',
          isNegotiable: false
        },
        availabilityDate: new Date('2025-09-05'),
        additionalSkills: ['Excel Expert', 'Detail Oriented', 'Reliable'],
        appliedAt: new Date('2025-08-21'),
        priority: 'Medium'
      });
    }
    
    const createdApplications = await Application.insertMany(applications);
    console.log(`✅ Created ${createdApplications.length} job applications`);
    
    return createdApplications;
  } catch (error) {
    console.error('❌ Error seeding applications:', error);
    throw error;
  }
};

/**
 * Update profession and employer preferred professions
 */
const updateRelationships = async (professions, employers) => {
  try {
    console.log('🔗 Updating relationships...');
    
    // Update employer preferred professions using seeded data
    const techEmployerId = seededData.employers.get('TechSolutions Pacific');
    if (techEmployerId) {
      await Employer.findByIdAndUpdate(techEmployerId, {
        preferredProfessions: [
          seededData.professions.get('SOFTDEV'),
          seededData.professions.get('DBA'),
          seededData.professions.get('NETADMIN')
        ]
      });
    }
    
    const constructionEmployerId = seededData.employers.get('Constructora Esparza');
    if (constructionEmployerId) {
      await Employer.findByIdAndUpdate(constructionEmployerId, {
        preferredProfessions: [
          seededData.professions.get('CIVENG'),
          seededData.professions.get('ELECENG')
        ]
      });
    }
    
    const healthcareEmployerId = seededData.employers.get('Clínica del Pacífico');
    if (healthcareEmployerId) {
      await Employer.findByIdAndUpdate(healthcareEmployerId, {
        preferredProfessions: [
          seededData.professions.get('RN')
        ]
      });
    }
    
    const electricalEmployerId = seededData.employers.get('Servicios Eléctricos MdO');
    if (electricalEmployerId) {
      await Employer.findByIdAndUpdate(electricalEmployerId, {
        preferredProfessions: [
          seededData.professions.get('ELECT'),
          seededData.professions.get('ELECENG')
        ]
      });
    }
    
    // Update profession statistics
    for (const profession of professions) {
      await profession.updateStatistics();
    }
    
    console.log('✅ Relationships updated successfully');
  } catch (error) {
    console.error('❌ Error updating relationships:', error);
    throw error;
  }
};

/**
 * Main seeding function
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('================================================');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearData();
    
    // Seed data in order (respecting dependencies)
    const professions = await seedProfessions();
    const professionals = await seedProfessionals();
    const employers = await seedEmployers();
    const curricula = await seedCurricula(professionals, professions);
    const jobOffers = await seedJobOffers();
    const applications = await seedApplications(jobOffers);
    
    // Update relationships and statistics
    await updateRelationships(professions, employers);
    
    console.log('================================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Professions: ${professions.length}`);
    console.log(`   - Professionals: ${professionals.length}`);
    console.log(`   - Employers: ${employers.length}`);
    console.log(`   - Curricula: ${curricula.length}`);
    console.log(`   - Job Offers: ${jobOffers.length}`);
    console.log(`   - Applications: ${applications.length}`);
    console.log('');
    console.log('🚀 Ready for GraphQL queries and reports!');
    console.log('');
    console.log('📋 Available test scenarios:');
    console.log('   - Professionals by profession area');
    console.log('   - Professionals by gender statistics');
    console.log('   - Job offers by canton');
    console.log('   - Application status tracking');
    console.log('   - Monthly application limits');
    console.log('   - Employer information with job postings');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔴 Database connection closed');
  }
};

/**
 * Run the seeding script
 */
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  clearData,
  seedProfessions,
  seedProfessionals,
  seedEmployers,
  seedCurricula,
  seedJobOffers,
  seedApplications
};