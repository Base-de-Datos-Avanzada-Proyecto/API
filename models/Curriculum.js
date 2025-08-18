/**
 * Curriculum Model (Digital Resume)
 * ITI-821 Advanced Database Course
 * 
 * Defines the schema for professional digital resumes/curricula
 * Handles education, work experience, certifications, and professional areas
 */

const mongoose = require('mongoose');

/**
 * Curriculum Schema Definition
 * Stores comprehensive professional information and experience
 */
const curriculumSchema = new mongoose.Schema({
  // Reference to professional
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: [true, 'Professional ID is required'],
    unique: true
  },
  
  // Professional areas (moved from Professional model)
  professions: [{
    professionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profession',
      required: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: [0, 'Experience years cannot be negative']
    },
    proficiencyLevel: {
      type: String,
      enum: {
        values: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        message: 'Proficiency level must be: Beginner, Intermediate, Advanced, or Expert'
      },
      default: 'Beginner'
    }
  }],
  
  // Educational background
  education: [{
    institution: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      maxlength: [150, 'Institution name cannot exceed 150 characters']
    },
    degree: {
      type: String,
      required: [true, 'Degree is required'],
      trim: true,
      maxlength: [100, 'Degree cannot exceed 100 characters']
    },
    fieldOfStudy: {
      type: String,
      trim: true,
      maxlength: [100, 'Field of study cannot exceed 100 characters']
    },
    educationLevel: {
      type: String,
      required: [true, 'Education level is required'],
      enum: {
        values: ['High School', 'Technical', 'Associate', 'Bachelor', 'Master', 'PhD', 'Other'],
        message: 'Education level must be one of the specified values'
      }
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(date) {
          return !date || date >= this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    gpa: {
      type: Number,
      min: [0, 'GPA cannot be negative'],
      max: [100, 'GPA cannot exceed 100']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters']
    }
  }],
  
  // Work experience
  workExperience: [{
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
      maxlength: [100, 'Position cannot exceed 100 characters']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(date) {
          return !date || date >= this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    isCurrentJob: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Job description cannot exceed 500 characters']
    },
    achievements: [{
      type: String,
      trim: true,
      maxlength: [200, 'Achievement cannot exceed 200 characters']
    }],
    skills: [{
      type: String,
      trim: true,
      maxlength: [50, 'Skill cannot exceed 50 characters']
    }],
    salary: {
      amount: {
        type: Number,
        min: [0, 'Salary cannot be negative']
      },
      currency: {
        type: String,
        default: 'CRC',
        enum: ['CRC', 'USD']
      }
    }
  }],
  
  // Professional certifications and licenses
  certifications: [{
    name: {
      type: String,
      required: [true, 'Certification name is required'],
      trim: true,
      maxlength: [150, 'Certification name cannot exceed 150 characters']
    },
    issuingOrganization: {
      type: String,
      required: [true, 'Issuing organization is required'],
      trim: true,
      maxlength: [100, 'Issuing organization cannot exceed 100 characters']
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required']
    },
    expirationDate: {
      type: Date,
      validate: {
        validator: function(date) {
          return !date || date > this.issueDate;
        },
        message: 'Expiration date must be after issue date'
      }
    },
    credentialId: {
      type: String,
      trim: true
    },
    credentialUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Credential URL must be a valid URL']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Technical and soft skills
  skills: [{
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      maxlength: [50, 'Skill name cannot exceed 50 characters']
    },
    category: {
      type: String,
      enum: {
        values: ['Technical', 'Soft', 'Language', 'Tool', 'Framework', 'Other'],
        message: 'Skill category must be one of the specified values'
      },
      default: 'Technical'
    },
    proficiencyLevel: {
      type: String,
      enum: {
        values: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        message: 'Proficiency level must be: Beginner, Intermediate, Advanced, or Expert'
      },
      default: 'Intermediate'
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, 'Years of experience cannot be negative']
    }
  }],
  
  // Languages
  languages: [{
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true
    },
    proficiency: {
      type: String,
      enum: {
        values: ['Basic', 'Conversational', 'Fluent', 'Native'],
        message: 'Language proficiency must be: Basic, Conversational, Fluent, or Native'
      },
      required: [true, 'Language proficiency is required']
    },
    certified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Professional summary
  summary: {
    type: String,
    trim: true,
    maxlength: [1000, 'Professional summary cannot exceed 1000 characters']
  },
  
  // Career objectives
  objectives: {
    type: String,
    trim: true,
    maxlength: [500, 'Career objectives cannot exceed 500 characters']
  },
  
  // Portfolio and references
  portfolio: {
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Website must be a valid URL']
    },
    linkedin: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    },
    other: [{
      platform: {
        type: String,
        trim: true
      },
      url: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'URL must be valid']
      }
    }]
  },
  
  // References
  references: [{
    name: {
      type: String,
      required: [true, 'Reference name is required'],
      trim: true
    },
    position: {
      type: String,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\d{4}-\d{4}$/, 'Phone must follow format: XXXX-XXXX']
    },
    relationship: {
      type: String,
      enum: {
        values: ['Supervisor', 'Colleague', 'Client', 'Professor', 'Other'],
        message: 'Relationship must be one of the specified values'
      }
    }
  }],
  
  // Curriculum status and metadata
  isComplete: {
    type: Boolean,
    default: false
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  lastReviewed: {
    type: Date
  },
  
  version: {
    type: Number,
    default: 1
  }
}, {
  // Schema options
  timestamps: true,
  collection: 'curricula'
});

/**
 * Indexes for optimal query performance
 */
curriculumSchema.index({ professionalId: 1 }, { unique: true });
curriculumSchema.index({ 'professions.professionId': 1 });
curriculumSchema.index({ isComplete: 1 });
curriculumSchema.index({ isPublic: 1 });
curriculumSchema.index({ 'education.educationLevel': 1 });
curriculumSchema.index({ 'skills.category': 1 });

/**
 * Virtual properties
 */
curriculumSchema.virtual('totalWorkExperience').get(function() {
  if (!this.workExperience || this.workExperience.length === 0) return 0;
  
  let totalMonths = 0;
  this.workExperience.forEach(job => {
    const startDate = new Date(job.startDate);
    const endDate = job.endDate ? new Date(job.endDate) : new Date();
    
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    totalMonths += Math.max(0, months);
  });
  
  return Math.round(totalMonths / 12 * 10) / 10; // Years with one decimal
});

curriculumSchema.virtual('highestEducation').get(function() {
  if (!this.education || this.education.length === 0) return 'None';
  
  const levels = ['High School', 'Technical', 'Associate', 'Bachelor', 'Master', 'PhD'];
  let highest = 0;
  
  this.education.forEach(edu => {
    const level = levels.indexOf(edu.educationLevel);
    if (level > highest) highest = level;
  });
  
  return levels[highest];
});

/**
 * Instance methods
 */

/**
 * Add a profession to the curriculum
 * @param {ObjectId} professionId - ID of the profession to add
 * @param {Object} options - Additional options (experienceYears, proficiencyLevel)
 * @returns {Promise<Curriculum>} Updated curriculum document
 */
curriculumSchema.methods.addProfession = async function(professionId, options = {}) {
  const exists = this.professions.some(p => p.professionId.toString() === professionId.toString());
  
  if (!exists) {
    this.professions.push({
      professionId: professionId,
      registrationDate: new Date(),
      experienceYears: options.experienceYears || 0,
      proficiencyLevel: options.proficiencyLevel || 'Beginner'
    });
    
    return await this.save();
  }
  
  return this;
};

/**
 * Remove a profession from the curriculum
 * @param {ObjectId} professionId - ID of the profession to remove
 * @returns {Promise<Curriculum>} Updated curriculum document
 */
curriculumSchema.methods.removeProfession = async function(professionId) {
  this.professions = this.professions.filter(p => p.professionId.toString() !== professionId.toString());
  return await this.save();
};

/**
 * Mark curriculum as complete
 * @returns {Promise<Curriculum>} Updated curriculum document
 */
curriculumSchema.methods.markAsComplete = async function() {
  this.isComplete = true;
  this.lastReviewed = new Date();
  this.version += 1;
  
  // Also update professional's profile completion status
  const Professional = mongoose.model('Professional');
  await Professional.findByIdAndUpdate(this.professionalId, {
    profileCompleted: true,
    lastUpdated: new Date()
  });
  
  return await this.save();
};

/**
 * Static methods
 */

/**
 * Find curricula by profession
 * @param {ObjectId} professionId - Profession ID
 * @returns {Promise<Array>} Array of curricula
 */
curriculumSchema.statics.findByProfession = function(professionId) {
  return this.find({
    'professions.professionId': professionId,
    isPublic: true,
    isComplete: true
  })
  .populate('professionalId')
  .populate('professions.professionId')
  .sort({ updatedAt: -1 });
};

/**
 * Get curricula statistics by profession
 * @returns {Promise<Array>} Aggregation result with statistics
 */
curriculumSchema.statics.getProfessionStats = function() {
  return this.aggregate([
    { $match: { isComplete: true } },
    { $unwind: '$professions' },
    {
      $group: {
        _id: '$professions.professionId',
        count: { $sum: 1 },
        avgExperience: { $avg: '$professions.experienceYears' },
        proficiencyLevels: { $push: '$professions.proficiencyLevel' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Find curricula by education level
 * @param {string} educationLevel - Education level
 * @returns {Promise<Array>} Array of curricula
 */
curriculumSchema.statics.findByEducationLevel = function(educationLevel) {
  return this.find({
    'education.educationLevel': educationLevel,
    isPublic: true,
    isComplete: true
  })
  .populate('professionalId')
  .sort({ updatedAt: -1 });
};

/**
 * Pre-save middleware
 */
curriculumSchema.pre('save', async function(next) {
  // Auto-determine if curriculum is complete
  if (this.professions.length > 0 && 
      (this.education.length > 0 || this.workExperience.length > 0) &&
      this.summary) {
    this.isComplete = true;
  }
  
  // Validate profession limit (same as original Professional model)
  if (this.professions.length === 0) {
    const error = new Error('At least one profession must be selected');
    error.name = 'ValidationError';
    return next(error);
  }
  
  next();
});

/**
 * Post-save middleware to update statistics
 */
curriculumSchema.post('save', async function(doc) {
  try {
    // Update profession statistics
    const Profession = mongoose.model('Profession');
    
    for (const professionData of doc.professions) {
      const profession = await Profession.findById(professionData.professionId);
      if (profession) {
        await profession.updateStatistics();
      }
    }
  } catch (error) {
    console.error('Error updating profession statistics:', error);
  }
});

// Ensure virtual fields are serialized
curriculumSchema.set('toJSON', { virtuals: true });
curriculumSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Curriculum', curriculumSchema);