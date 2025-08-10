/**
 * Validation Middleware
 * ITI-821 Advanced Database Course
 * 
 * Provides validation middleware for request data validation
 * using Joi schema validation library
 */

const Joi = require('joi');

/**
 * Professional validation schema
 */
const professionalSchema = Joi.object({
  cedula: Joi.string()
    .pattern(/^\d{1}-\d{4}-\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Cedula must follow format: X-XXXX-XXXX',
      'any.required': 'Cedula is required'
    }),
    
  firstName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    
  lastName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    
  phone: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must follow format: XXXX-XXXX',
      'any.required': 'Phone number is required'
    }),
    
  canton: Joi.string()
    .valid('Puntarenas', 'Esparza', 'MonteDeOro')
    .required()
    .messages({
      'any.only': 'Canton must be one of: Puntarenas, Esparza, MonteDeOro',
      'any.required': 'Canton is required'
    }),
    
  address: Joi.string()
    .max(200)
    .trim()
    .required()
    .messages({
      'string.max': 'Address cannot exceed 200 characters',
      'any.required': 'Address is required'
    }),
    
  birthDate: Joi.date()
    .max('now')
    .required()
    .custom((value, helpers) => {
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      if (value > eighteenYearsAgo) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'date.max': 'Birth date cannot be in the future',
      'any.invalid': 'Professional must be at least 18 years old',
      'any.required': 'Birth date is required'
    }),
    
  gender: Joi.string()
    .valid('Male', 'Female', 'Other')
    .required()
    .messages({
      'any.only': 'Gender must be Male, Female, or Other',
      'any.required': 'Gender is required'
    }),
    
  professionIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one profession must be selected',
      'string.pattern.base': 'Invalid profession ID format',
      'any.required': 'Profession IDs are required'
    })
});

/**
 * Employer validation schema
 */
const employerSchema = Joi.object({
  identification: Joi.string()
    .required()
    .custom((value, helpers) => {
      const { employerType } = helpers.state.ancestors[0];
      
      if (employerType === 'fisica') {
        // Validate cédula format for individuals
        const cedulaRegex = /^\d{1}-?\d{4}-?\d{4}$/;
        if (!cedulaRegex.test(value)) {
          return helpers.error('any.invalid', { message: 'Cédula must follow format: X-XXXX-XXXX' });
        }
      } else if (employerType === 'juridica') {
        // Validate legal entity identification
        const juridicaRegex = /^\d{3}-?\d{6}-?\d{4}$/;
        if (!juridicaRegex.test(value)) {
          return helpers.error('any.invalid', { message: 'Legal entity identification must follow format: XXX-XXXXXX-XXXX' });
        }
      }
      
      return value;
    })
    .messages({
      'any.required': 'Identification is required'
    }),
    
  employerType: Joi.string()
    .valid('fisica', 'juridica')
    .required()
    .messages({
      'any.only': 'Employer type must be either "fisica" (individual) or "juridica" (legal entity)',
      'any.required': 'Employer type is required'
    }),
    
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
    
  lastName: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .when('employerType', {
      is: 'fisica',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required for individual employers'
    }),
    
  legalName: Joi.string()
    .max(150)
    .trim()
    .when('employerType', {
      is: 'juridica',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.max': 'Legal name cannot exceed 150 characters',
      'any.required': 'Legal name is required for legal entities'
    }),
    
  businessSector: Joi.string()
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.max': 'Business sector cannot exceed 100 characters'
    }),
    
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    
  phone: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must follow format: XXXX-XXXX',
      'any.required': 'Phone number is required'
    }),
    
  alternativePhone: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Alternative phone must follow format: XXXX-XXXX'
    }),
    
  canton: Joi.string()
    .valid('Puntarenas', 'Esparza', 'MonteDeOro')
    .required()
    .messages({
      'any.only': 'Canton must be one of: Puntarenas, Esparza, MonteDeOro',
      'any.required': 'Canton is required'
    }),
    
  address: Joi.string()
    .max(200)
    .trim()
    .required()
    .messages({
      'string.max': 'Address cannot exceed 200 characters',
      'any.required': 'Address is required'
    }),
    
  website: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .trim()
    .optional()
    .messages({
      'string.uri': 'Website must be a valid URL starting with http:// or https://'
    }),
    
  description: Joi.string()
    .max(500)
    .trim()
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
    
  expectedHires: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'Expected hires must be at least 1',
      'number.max': 'Expected hires cannot exceed 1000'
    }),
    
  preferredProfessionIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .optional()
    .messages({
      'string.pattern.base': 'Invalid profession ID format'
    }),
    
  registrationNumber: Joi.string()
    .trim()
    .when('employerType', {
      is: 'juridica',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.required': 'Registration number is required for legal entities'
    })
});

/**
 * Job Offer validation schema
 */
const jobOfferSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Job title must be at least 5 characters',
      'string.max': 'Job title cannot exceed 100 characters',
      'any.required': 'Job title is required'
    }),
    
  description: Joi.string()
    .min(20)
    .max(2000)
    .trim()
    .required()
    .messages({
      'string.min': 'Job description must be at least 20 characters',
      'string.max': 'Job description cannot exceed 2000 characters',
      'any.required': 'Job description is required'
    }),
    
  employerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid employer ID format',
      'any.required': 'Employer ID is required'
    }),
    
  requiredProfessions: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one required profession must be specified',
      'string.pattern.base': 'Invalid profession ID format',
      'any.required': 'Required professions are required'
    }),
    
  workType: Joi.string()
    .valid('Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship')
    .required()
    .messages({
      'any.only': 'Work type must be one of: Full-time, Part-time, Contract, Temporary, Internship',
      'any.required': 'Work type is required'
    }),
    
  workModality: Joi.string()
    .valid('On-site', 'Remote', 'Hybrid')
    .required()
    .messages({
      'any.only': 'Work modality must be: On-site, Remote, or Hybrid',
      'any.required': 'Work modality is required'
    }),
    
  location: Joi.object({
    canton: Joi.string()
      .valid('Puntarenas', 'Esparza', 'MonteDeOro')
      .required()
      .messages({
        'any.only': 'Canton must be one of: Puntarenas, Esparza, MonteDeOro',
        'any.required': 'Canton is required'
      }),
    specificLocation: Joi.string()
      .max(200)
      .trim()
      .optional()
      .messages({
        'string.max': 'Specific location cannot exceed 200 characters'
      })
  }).required(),
    
  salary: Joi.object({
    min: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.min': 'Minimum salary cannot be negative'
      }),
    max: Joi.number()
      .min(0)
      .when('min', {
        is: Joi.exist(),
        then: Joi.number().min(Joi.ref('min'))
      })
      .optional()
      .messages({
        'number.min': 'Maximum salary cannot be negative or less than minimum salary'
      }),
    currency: Joi.string()
      .valid('CRC', 'USD')
      .default('CRC'),
    isNegotiable: Joi.boolean()
      .default(false)
  }).optional(),
    
  requirements: Joi.array()
    .items(Joi.string().max(200).trim())
    .max(50)
    .optional()
    .messages({
      'string.max': 'Each requirement cannot exceed 200 characters',
      'array.max': 'Cannot have more than 50 requirements'
    }),
    
  preferredSkills: Joi.array()
    .items(Joi.string().max(50).trim())
    .max(30)
    .optional()
    .messages({
      'string.max': 'Each skill cannot exceed 50 characters',
      'array.max': 'Cannot have more than 30 skills'
    }),
    
  experienceRequired: Joi.number()
    .integer()
    .min(0)
    .max(50)
    .default(0)
    .messages({
      'number.min': 'Experience required cannot be negative',
      'number.max': 'Experience required cannot exceed 50 years'
    }),
    
  educationLevel: Joi.string()
    .valid('None', 'High School', 'Technical', 'Bachelor', 'Master', 'PhD')
    .optional()
    .messages({
      'any.only': 'Education level must be one of the specified values'
    }),
    
  applicationDeadline: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.greater': 'Application deadline must be in the future',
      'any.required': 'Application deadline is required'
    }),
    
  maxApplications: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(50)
    .messages({
      'number.min': 'Maximum applications must be at least 1',
      'number.max': 'Maximum applications cannot exceed 1000'
    }),
    
  contactEmail: Joi.string()
    .email()
    .trim()
    .lowercase()
    .optional()
    .messages({
      'string.email': 'Please provide a valid contact email address'
    }),
    
  contactPhone: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Contact phone must follow format: XXXX-XXXX'
    })
});

/**
 * Bulk upload validation schema
 */
const bulkUploadSchema = Joi.object({
  file: Joi.object({
    mimetype: Joi.string()
      .valid('text/csv', 'application/json')
      .required()
      .messages({
        'any.only': 'Only CSV and JSON files are allowed'
      }),
    size: Joi.number()
      .max(10 * 1024 * 1024) // 10MB
      .required()
      .messages({
        'number.max': 'File size cannot exceed 10MB'
      })
  }).unknown(true).required()
});

/**
 * Middleware function to validate professional data
 */
const validateProfessional = (req, res, next) => {
  const { error } = professionalSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

/**
 * Middleware function to validate employer data
 */
const validateEmployer = (req, res, next) => {
  const { error } = employerSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

/**
 * Middleware function to validate job offer data
 */
const validateJobOffer = (req, res, next) => {
  const { error } = jobOfferSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

/**
 * Middleware function to validate bulk upload
 */
const validateBulkUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  const { error } = bulkUploadSchema.validate({ file: req.file }, { 
    abortEarly: false 
  });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'File validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

/**
 * Middleware function to validate query parameters
 */
const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

/**
 * Common query parameter schemas
 */
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});

const professionalQuerySchema = paginationSchema.keys({
  canton: Joi.string()
    .valid('Puntarenas', 'Esparza', 'MonteDeOro')
    .optional(),
  profession: Joi.string()
    .trim()
    .optional(),
  gender: Joi.string()
    .valid('Male', 'Female', 'Other')
    .optional()
});

const employerQuerySchema = paginationSchema.keys({
  canton: Joi.string()
    .valid('Puntarenas', 'Esparza', 'MonteDeOro')
    .optional(),
  employerType: Joi.string()
    .valid('fisica', 'juridica')
    .optional(),
  businessSector: Joi.string()
    .trim()
    .optional(),
  isVerified: Joi.string()
    .valid('true', 'false')
    .optional()
});

/**
 * Error handling middleware for validation errors
 */
const handleValidationError = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Mongoose validation error',
      errors: Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
      }))
    });
  }
  
  if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry error',
      errors: [{
        field: field,
        message: `${field} already exists`
      }]
    });
  }
  
  next(err);
};

module.exports = {
  validateProfessional,
  validateEmployer,
  validateJobOffer,
  validateBulkUpload,
  validateQueryParams,
  professionalQuerySchema,
  employerQuerySchema,
  paginationSchema,
  handleValidationError,
  // Export schemas for direct use if needed
  professionalSchema,
  employerSchema,
  jobOfferSchema,
  bulkUploadSchema
};