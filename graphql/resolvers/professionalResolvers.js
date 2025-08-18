/**
 * Professional GraphQL Resolvers
 * ITI-821 Advanced Database Course
 * 
 * Implements GraphQL resolvers for professional operations
 * Updated to work with simplified Professional model and Curriculum model
 */

const Professional = require('../../models/Professional');
const Curriculum = require('../../models/Curriculum');
const Profession = require('../../models/Profession');

const professionalResolvers = {
  Query: {
    /**
     * Get all professionals with optional filtering and sorting
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments
     * @returns {Promise<Array>} Array of professionals
     */
    professionals: async (parent, { filter, sort, limit, offset }) => {
      try {
        let query = { isActive: true };
        
        // Apply filters
        if (filter) {
          if (filter.canton) query.canton = filter.canton;
          if (filter.gender) query.gender = filter.gender;
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          
          if (filter.searchText) {
            const searchRegex = new RegExp(filter.searchText, 'i');
            query.$or = [
              { firstName: searchRegex },
              { lastName: searchRegex },
              { email: searchRegex },
              { cedula: searchRegex }
            ];
          }
          
          // Age range filter
          if (filter.ageMin || filter.ageMax) {
            const currentDate = new Date();
            if (filter.ageMax) {
              const minBirthDate = new Date(currentDate.getFullYear() - filter.ageMax - 1, currentDate.getMonth(), currentDate.getDate());
              query.birthDate = { $gte: minBirthDate };
            }
            if (filter.ageMin) {
              const maxBirthDate = new Date(currentDate.getFullYear() - filter.ageMin, currentDate.getMonth(), currentDate.getDate());
              if (query.birthDate) {
                query.birthDate.$lte = maxBirthDate;
              } else {
                query.birthDate = { $lte: maxBirthDate };
              }
            }
          }
          
          // Filter by profession through curriculum
          if (filter.professionId) {
            const curricula = await Curriculum.find({
              'professions.professionId': filter.professionId
            }).select('professionalId');
            
            const professionalIds = curricula.map(c => c.professionalId);
            query._id = { $in: professionalIds };
          }
        }
        
        // Build query
        let professionalQuery = Professional.find(query);
        
        // Apply sorting
        if (sort) {
          const sortOrder = sort.order === 'DESC' ? -1 : 1;
          professionalQuery = professionalQuery.sort({ [sort.field]: sortOrder });
        } else {
          professionalQuery = professionalQuery.sort({ firstName: 1, lastName: 1 });
        }
        
        // Apply pagination
        if (offset) professionalQuery = professionalQuery.skip(offset);
        if (limit) professionalQuery = professionalQuery.limit(limit);
        
        return await professionalQuery.exec();
      } catch (error) {
        throw new Error(`Error fetching professionals: ${error.message}`);
      }
    },

    /**
     * Get professional by ID
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with ID
     * @returns {Promise<Object>} Professional document
     */
    professional: async (parent, { id }) => {
      try {
        const professional = await Professional.findById(id);
        if (!professional) {
          throw new Error('Professional not found');
        }
        return professional;
      } catch (error) {
        throw new Error(`Error fetching professional: ${error.message}`);
      }
    },

    /**
     * Get professional by cedula
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with cedula
     * @returns {Promise<Object>} Professional document
     */
    professionalByCedula: async (parent, { cedula }) => {
      try {
        const professional = await Professional.findOne({ cedula });
        if (!professional) {
          throw new Error('Professional not found');
        }
        return professional;
      } catch (error) {
        throw new Error(`Error fetching professional by cedula: ${error.message}`);
      }
    },

    /**
     * Get professionals by canton
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with canton
     * @returns {Promise<Array>} Array of professionals
     */
    professionalsByCanton: async (parent, { canton }) => {
      try {
        return await Professional.findByCanton(canton);
      } catch (error) {
        throw new Error(`Error fetching professionals by canton: ${error.message}`);
      }
    },

    /**
     * Get professionals by profession
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with profession ID
     * @returns {Promise<Array>} Array of professionals
     */
    professionalsByProfession: async (parent, { professionId }) => {
      try {
        return await Professional.findByProfession(professionId);
      } catch (error) {
        throw new Error(`Error fetching professionals by profession: ${error.message}`);
      }
    },

    /**
     * Get professionals by gender
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with gender
     * @returns {Promise<Array>} Array of professionals
     */
    professionalsByGender: async (parent, { gender }) => {
      try {
        return await Professional.find({ gender, isActive: true })
          .sort({ firstName: 1, lastName: 1 });
      } catch (error) {
        throw new Error(`Error fetching professionals by gender: ${error.message}`);
      }
    },

    /**
     * Get professional gender statistics
     * @returns {Promise<Array>} Array of gender statistics
     */
    professionalGenderStats: async () => {
      try {
        const stats = await Professional.getGenderStats();
        return stats.map(stat => ({
          gender: stat._id,
          count: stat.count
        }));
      } catch (error) {
        throw new Error(`Error fetching professional gender stats: ${error.message}`);
      }
    },

    /**
     * Get professional statistics by profession area
     * @returns {Promise<Array>} Array of profession statistics
     */
    professionalProfessionStats: async () => {
      try {
        // Get profession statistics through curriculum
        const stats = await Curriculum.aggregate([
          { $unwind: '$professions' },
          {
            $group: {
              _id: '$professions.professionId',
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'professions',
              localField: '_id',
              foreignField: '_id',
              as: 'profession'
            }
          },
          { $unwind: '$profession' },
          {
            $project: {
              profession: '$profession',
              count: 1
            }
          },
          { $sort: { count: -1 } }
        ]);
        
        // Calculate total for percentage
        const total = await Curriculum.countDocuments();
        
        return stats.map(stat => ({
          profession: stat.profession,
          count: stat.count,
          percentage: parseFloat(((stat.count / total) * 100).toFixed(2))
        }));
      } catch (error) {
        throw new Error(`Error fetching professional profession stats: ${error.message}`);
      }
    },

    /**
     * Get total professionals count
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with optional filter
     * @returns {Promise<Number>} Total count
     */
    professionalsCount: async (parent, { filter }) => {
      try {
        let query = { isActive: true };
        
        if (filter) {
          if (filter.canton) query.canton = filter.canton;
          if (filter.gender) query.gender = filter.gender;
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          
          if (filter.searchText) {
            const searchRegex = new RegExp(filter.searchText, 'i');
            query.$or = [
              { firstName: searchRegex },
              { lastName: searchRegex },
              { email: searchRegex },
              { cedula: searchRegex }
            ];
          }
          
          if (filter.professionId) {
            const curricula = await Curriculum.find({
              'professions.professionId': filter.professionId
            }).select('professionalId');
            
            const professionalIds = curricula.map(c => c.professionalId);
            query._id = { $in: professionalIds };
          }
        }
        
        return await Professional.countDocuments(query);
      } catch (error) {
        throw new Error(`Error counting professionals: ${error.message}`);
      }
    },

    /**
     * Get specific professional information for reports
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with cedula
     * @returns {Promise<Object>} Professional info object
     */
    professionalInfo: async (parent, { cedula }) => {
      try {
        const professional = await Professional.findOne({ cedula });
        
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        const professions = await professional.getProfessions();
        
        return {
          cedula: professional.cedula,
          name: professional.fullName,
          professions: professions.map(p => p.professionId.name)
        };
      } catch (error) {
        throw new Error(`Error fetching professional info: ${error.message}`);
      }
    },

    /**
     * Search professionals by text
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with search text
     * @returns {Promise<Array>} Array of matching professionals
     */
    searchProfessionals: async (parent, { searchText }) => {
      try {
        const searchRegex = new RegExp(searchText, 'i');
        return await Professional.find({
          isActive: true,
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { cedula: searchRegex }
          ]
        })
        .sort({ firstName: 1, lastName: 1 });
      } catch (error) {
        throw new Error(`Error searching professionals: ${error.message}`);
      }
    },

    /**
     * Get professionals by age range
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with age range
     * @returns {Promise<Array>} Array of professionals in age range
     */
    professionalsByAgeRange: async (parent, { minAge, maxAge }) => {
      try {
        const currentDate = new Date();
        const minBirthDate = new Date(currentDate.getFullYear() - maxAge - 1, currentDate.getMonth(), currentDate.getDate());
        const maxBirthDate = new Date(currentDate.getFullYear() - minAge, currentDate.getMonth(), currentDate.getDate());
        
        return await Professional.find({
          isActive: true,
          birthDate: {
            $gte: minBirthDate,
            $lte: maxBirthDate
          }
        })
        .sort({ birthDate: -1 });
      } catch (error) {
        throw new Error(`Error fetching professionals by age range: ${error.message}`);
      }
    }
  },

  Mutation: {
    /**
     * Create new professional (basic profile only)
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with input data
     * @returns {Promise<Object>} Created professional document
     */
    createProfessional: async (parent, { input }) => {
      try {
        const professional = new Professional(input);
        const savedProfessional = await professional.save();
        
        return savedProfessional;
      } catch (error) {
        if (error.code === 11000) {
          throw new Error('Professional with this cedula or email already exists');
        }
        throw new Error(`Error creating professional: ${error.message}`);
      }
    },

    /**
     * Update professional
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and input data
     * @returns {Promise<Object>} Updated professional document
     */
    updateProfessional: async (parent, { id, input }) => {
      try {
        const professional = await Professional.findByIdAndUpdate(
          id,
          { ...input, lastUpdated: new Date() },
          { new: true, runValidators: true }
        );
        
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        return professional;
      } catch (error) {
        throw new Error(`Error updating professional: ${error.message}`);
      }
    },

    /**
     * Delete professional (soft delete)
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Boolean>} Success status
     */
    deleteProfessional: async (parent, { id }) => {
      try {
        const professional = await Professional.findByIdAndUpdate(
          id,
          { isActive: false, lastUpdated: new Date() },
          { new: true }
        );
        
        return !!professional;
      } catch (error) {
        throw new Error(`Error deleting professional: ${error.message}`);
      }
    },

    /**
     * Toggle professional active status
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated professional document
     */
    toggleProfessionalStatus: async (parent, { id }) => {
      try {
        const professional = await Professional.findById(id);
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        professional.isActive = !professional.isActive;
        professional.lastUpdated = new Date();
        
        return await professional.save();
      } catch (error) {
        throw new Error(`Error toggling professional status: ${error.message}`);
      }
    },

    /**
     * Update professional contact information
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and contact data
     * @returns {Promise<Object>} Updated professional document
     */
    updateProfessionalContact: async (parent, { id, email, phone, address }) => {
      try {
        const updateData = { lastUpdated: new Date() };
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        
        const professional = await Professional.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );
        
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        return professional;
      } catch (error) {
        throw new Error(`Error updating professional contact: ${error.message}`);
      }
    },

    /**
     * Mark profile as completed
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated professional document
     */
    completeProfile: async (parent, { id }) => {
      try {
        const professional = await Professional.findById(id);
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        return await professional.completeProfile();
      } catch (error) {
        throw new Error(`Error completing profile: ${error.message}`);
      }
    },

    /**
     * Validate professional monthly application limit
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with professional ID
     * @returns {Promise<Object>} Application limit status
     */
    validateMonthlyApplicationLimit: async (parent, { professionalId }) => {
      try {
        const professional = await Professional.findById(professionalId);
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        return await professional.canApplyToMoreJobs();
      } catch (error) {
        throw new Error(`Error validating monthly application limit: ${error.message}`);
      }
    }
  },

  // Field resolvers
  Professional: {
    /**
     * Get curriculum for the professional
     * @param {Object} parent - Professional document
     * @returns {Promise<Object>} Professional's curriculum
     */
    curriculum: async (parent) => {
      try {
        return await parent.getCurriculum();
      } catch (error) {
        console.error('Error fetching curriculum:', error);
        return null;
      }
    },

    /**
     * Get professions through curriculum
     * @param {Object} parent - Professional document
     * @returns {Promise<Array>} Array of professions from curriculum
     */
    professions: async (parent) => {
      try {
        return await parent.getProfessions();
      } catch (error) {
        console.error('Error fetching professions:', error);
        return [];
      }
    },

    /**
     * Check if professional has curriculum
     * @param {Object} parent - Professional document
     * @returns {Promise<Boolean>} Whether curriculum exists
     */
    hasCurriculum: async (parent) => {
      try {
        return await parent.hasCurriculum();
      } catch (error) {
        console.error('Error checking curriculum:', error);
        return false;
      }
    },

    /**
     * Get monthly applications count
     * @param {Object} parent - Professional document
     * @returns {Promise<Number>} Count of applications this month
     */
    monthlyApplicationsCount: async (parent) => {
      try {
        return await parent.getMonthlyApplicationCount();
      } catch (error) {
        console.error('Error fetching monthly applications count:', error);
        return 0;
      }
    },

    /**
     * Get applications for the professional
     * @param {Object} parent - Professional document
     * @returns {Promise<Array>} Array of job applications
     */
    applications: async (parent) => {
      try {
        // TODO: Implement when JobApplication model is ready
        // const JobApplication = require('../models/JobApplication');
        // return await JobApplication.find({ professionalId: parent._id })
        //   .populate('jobOfferId')
        //   .sort({ applicationDate: -1 });
        return [];
      } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
      }
    }
  }
};

module.exports = professionalResolvers;