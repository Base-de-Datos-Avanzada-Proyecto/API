/**
 * Professional Model - Simplified Version
 * ITI-821 Advanced Database Course
 * 
 * Defines basic personal information for professional users
 * Professional areas and detailed experience now handled by Curriculum model
 */

const mongoose = require('mongoose');

/**
 * Professional Schema Definition
 * Stores only essential personal and contact information
 */
const professionalSchema = new mongoose.Schema({
  // Personal identification
  cedula: {
    type: String,
    required: [true, 'Cedula is required'],
    unique: true,
    trim: true,
    match: [/^\d{1}-\d{4}-\d{4}$/, 'Cedula must follow format: X-XXXX-XXXX']
  },
  
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  // Contact information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\d{4}-\d{4}$/, 'Phone must follow format: XXXX-XXXX']
  },
  
  // Address information
  canton: {
    type: String,
    required: [true, 'Canton is required'],
    enum: {
      values: ['Puntarenas', 'Esparza', 'MonteDeOro'],
      message: 'Canton must be one of: Puntarenas, Esparza, MonteDeOro'
    }
  },
  
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  
  // Personal information
  birthDate: {
    type: Date,
    required: [true, 'Birth date is required'],
    validate: {
      validator: function(date) {
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        return date <= eighteenYearsAgo;
      },
      message: 'Professional must be at least 18 years old'
    }
  },
  
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: 'Gender must be Male, Female, or Other'
    }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Profile completion status
  profileCompleted: {
    type: Boolean,
    default: false
  },
  
  // Registration metadata
  registrationDate: {
    type: Date,
    default: Date.now
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  // Schema options
  timestamps: true,
  collection: 'professionals'
});

/**
 * Indexes for optimal query performance
 */
professionalSchema.index({ cedula: 1 }, { unique: true });
professionalSchema.index({ email: 1 }, { unique: true });
professionalSchema.index({ canton: 1 });
professionalSchema.index({ gender: 1 });
professionalSchema.index({ isActive: 1 });

/**
 * Virtual properties
 */
professionalSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

professionalSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

/**
 * Instance methods
 */

/**
 * Get professional's curriculum
 * @returns {Promise<Curriculum>} Professional's curriculum document
 */
professionalSchema.methods.getCurriculum = async function() {
  const Curriculum = mongoose.model('Curriculum');
  return await Curriculum.findOne({ professionalId: this._id });
};

/**
 * Check if professional has a curriculum
 * @returns {Promise<boolean>} Whether curriculum exists
 */
professionalSchema.methods.hasCurriculum = async function() {
  const Curriculum = mongoose.model('Curriculum');
  const curriculum = await Curriculum.findOne({ professionalId: this._id });
  return !!curriculum;
};

/**
 * Get professional's active professions through curriculum
 * @returns {Promise<Array>} Array of professions from curriculum
 */
professionalSchema.methods.getProfessions = async function() {
  const Curriculum = mongoose.model('Curriculum');
  const curriculum = await Curriculum.findOne({ professionalId: this._id })
    .populate('professions.professionId');
  
  return curriculum ? curriculum.professions : [];
};

/**
 * Get monthly application count for this professional
 * @returns {Promise<number>} Count of applications this month
 */
professionalSchema.methods.getMonthlyApplicationCount = async function() {
  const Application = mongoose.model('Application');
  return await Application.getMonthlyCount(this._id);
};

/**
 * Check if professional can apply to more jobs this month
 * @returns {Promise<Object>} Object with canApply boolean and remaining count
 */
professionalSchema.methods.canApplyToMoreJobs = async function() {
  const monthlyCount = await this.getMonthlyApplicationCount();
  const remaining = Math.max(0, 3 - monthlyCount);
  
  return {
    canApply: remaining > 0,
    remaining: remaining,
    used: monthlyCount
  };
};

/**
 * Mark profile as completed
 * @returns {Promise<Professional>} Updated professional document
 */
professionalSchema.methods.completeProfile = async function() {
  this.profileCompleted = true;
  this.lastUpdated = new Date();
  return await this.save();
};

/**
 * Static methods
 */

/**
 * Find professionals by canton
 * @param {string} canton - Canton name
 * @returns {Promise<Array>} Array of professionals in the canton
 */
professionalSchema.statics.findByCanton = function(canton) {
  return this.find({ canton, isActive: true })
    .sort({ registrationDate: -1 });
};

/**
 * Find professionals by profession (through curriculum)
 * @param {ObjectId} professionId - Profession ID
 * @returns {Promise<Array>} Array of professionals in that profession
 */
professionalSchema.statics.findByProfession = async function(professionId) {
  const Curriculum = mongoose.model('Curriculum');
  
  // Find curricula with the specified profession
  const curricula = await Curriculum.find({
    'professions.professionId': professionId
  }).select('professionalId');
  
  const professionalIds = curricula.map(c => c.professionalId);
  
  return this.find({
    _id: { $in: professionalIds },
    isActive: true
  }).sort({ registrationDate: -1 });
};

/**
 * Get professionals count by gender
 * @returns {Promise<Array>} Aggregation result with counts by gender
 */
professionalSchema.statics.getGenderStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { 
      _id: '$gender', 
      count: { $sum: 1 } 
    }},
    { $sort: { _id: 1 } }
  ]);
};

/**
 * Get professionals with completed profiles
 * @returns {Promise<Array>} Array of professionals with completed profiles
 */
professionalSchema.statics.findWithCompletedProfiles = function() {
  return this.find({ 
    isActive: true, 
    profileCompleted: true 
  }).sort({ registrationDate: -1 });
};

/**
 * Get general statistics
 * @returns {Promise<Object>} Statistics object
 */
professionalSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        completed: { $sum: { $cond: ['$profileCompleted', 1, 0] } },
        male: { $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] } },
        female: { $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] } },
        other: { $sum: { $cond: [{ $eq: ['$gender', 'Other'] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    active: 0,
    completed: 0,
    male: 0,
    female: 0,
    other: 0
  };
};

/**
 * Pre-save middleware
 */
professionalSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

/**
 * Post-save middleware to update profession statistics
 */
professionalSchema.post('save', async function(doc) {
  try {
    // Update profession statistics when a new professional is created
    if (doc.isNew) {
      const Curriculum = mongoose.model('Curriculum');
      const curriculum = await Curriculum.findOne({ professionalId: doc._id });
      
      if (curriculum && curriculum.professions) {
        const Profession = mongoose.model('Profession');
        
        // Update statistics for each profession
        for (const professionData of curriculum.professions) {
          const profession = await Profession.findById(professionData.professionId);
          if (profession) {
            await profession.updateStatistics();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating profession statistics:', error);
  }
});

// Ensure virtual fields are serialized
professionalSchema.set('toJSON', { virtuals: true });
professionalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Professional', professionalSchema);