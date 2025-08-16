/**
 * Professional GraphQL Resolvers
 * ITI-821 Advanced Database Course
 * 
 * Implements GraphQL resolvers for professional operations
 */

const Professional = require('../../models/Professional');
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
        let query = {};
        
        // Apply filters
        if (filter) {
          if (filter.canton) query.canton = filter.canton;
          if (filter.gender) query.gender = filter.gender;
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          if (filter.professionId) {
            query['professions.professionId'] = filter.professionId;
          }
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
        }
        
        // Build query
        let professionalQuery = Professional.find(query).populate('professions.professionId');
        
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
        const professional = await Professional.findById(id).populate('professions.professionId');
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
        const professional = await Professional.findOne({ cedula }).populate('professions.professionId');
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
          .populate('professions.professionId')
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
        const stats = await Professional.aggregate([
          { $match: { isActive: true } },
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
              count: 1,
              percentage: {
                $multiply: [
                  { $divide: ['$count', { $sum: '$count' }] },
                  100
                ]
              }
            }
          },
          { $sort: { count: -1 } }
        ]);
        
        // Calculate total for percentage
        const total = await Professional.countDocuments({ isActive: true });
        
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
        let query = {};
        
        if (filter) {
          if (filter.canton) query.canton = filter.canton;
          if (filter.gender) query.gender = filter.gender;
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          if (filter.professionId) {
            query['professions.professionId'] = filter.professionId;
          }
          if (filter.searchText) {
            const searchRegex = new RegExp(filter.searchText, 'i');
            query.$or = [
              { firstName: searchRegex },
              { lastName: searchRegex },
              { email: searchRegex },
              { cedula: searchRegex }
            ];
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
        const professional = await Professional.findOne({ cedula })
          .populate('professions.professionId');
        
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        return {
          cedula: professional.cedula,
          name: professional.fullName,
          professions: professional.professions.map(p => p.professionId.name)
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
        .populate('professions.professionId')
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
        .populate('professions.professionId')
        .sort({ birthDate: -1 });
      } catch (error) {
        throw new Error(`Error fetching professionals by age range: ${error.message}`);
      }
    }
  },

  Mutation: {
    /**
     * Create new professional
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with input data
     * @returns {Promise<Object>} Created professional document
     */
    createProfessional: async (parent, { input }) => {
      try {
        // Transform professions input format
        const professionalData = {
          ...input,
          professions: input.professions.map(p => ({
            professionId: p.professionId,
            registrationDate: new Date()
          }))
        };
        
        const professional = new Professional(professionalData);
        const savedProfessional = await professional.save();
        
        // Update profession statistics
        for (const profession of input.professions) {
          try {
            const prof = await Profession.findById(profession.professionId);
            if (prof) {
              await prof.updateStatistics();
            }
          } catch (error) {
            console.error('Error updating profession statistics:', error);
          }
        }
        
        return await Professional.findById(savedProfessional._id).populate('professions.professionId');
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
        ).populate('professions.professionId');
        
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
     * Add profession to professional
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with professional ID and profession ID
     * @returns {Promise<Object>} Updated professional document
     */
    addProfessionToProfessional: async (parent, { professionalId, professionId }) => {
      try {
        const professional = await Professional.findById(professionalId);
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        const updatedProfessional = await professional.addProfession(professionId);
        
        // Update profession statistics
        const profession = await Profession.findById(professionId);
        if (profession) {
          await profession.updateStatistics();
        }
        
        return await Professional.findById(updatedProfessional._id).populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error adding profession to professional: ${error.message}`);
      }
    },

    /**
     * Remove profession from professional
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with professional ID and profession ID
     * @returns {Promise<Object>} Updated professional document
     */
    removeProfessionFromProfessional: async (parent, { professionalId, professionId }) => {
      try {
        const professional = await Professional.findById(professionalId);
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        const updatedProfessional = await professional.removeProfession(professionId);
        
        // Update profession statistics
        const profession = await Profession.findById(professionId);
        if (profession) {
          await profession.updateStatistics();
        }
        
        return await Professional.findById(updatedProfessional._id).populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error removing profession from professional: ${error.message}`);
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
        
        const updatedProfessional = await professional.save();
        return await Professional.findById(updatedProfessional._id).populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error toggling professional status: ${error.message}`);
      }
    },

    /**
     * Bulk create professionals
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with array of input data
     * @returns {Promise<Array>} Array of created professional documents
     */
    createProfessionals: async (parent, { input }) => {
      try {
        const professionals = [];
        const errors = [];
        
        for (const professionalData of input) {
          try {
            // Transform professions input format
            const transformedData = {
              ...professionalData,
              professions: professionalData.professions.map(p => ({
                professionId: p.professionId,
                registrationDate: new Date()
              }))
            };
            
            const professional = new Professional(transformedData);
            const savedProfessional = await professional.save();
            professionals.push(await Professional.findById(savedProfessional._id).populate('professions.professionId'));
          } catch (error) {
            errors.push({
              data: professionalData,
              error: error.message
            });
          }
        }
        
        // Update profession statistics for all affected professions
        const professionIds = new Set();
        professionals.forEach(prof => {
          prof.professions.forEach(p => professionIds.add(p.professionId._id.toString()));
        });
        
        for (const professionId of professionIds) {
          try {
            const profession = await Profession.findById(professionId);
            if (profession) {
              await profession.updateStatistics();
            }
          } catch (error) {
            console.error('Error updating profession statistics:', error);
          }
        }
        
        if (errors.length > 0) {
          console.log('Bulk creation completed with some errors:', errors);
        }
        
        return professionals;
      } catch (error) {
        throw new Error(`Error bulk creating professionals: ${error.message}`);
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
        ).populate('professions.professionId');
        
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        return professional;
      } catch (error) {
        throw new Error(`Error updating professional contact: ${error.message}`);
      }
    },

    /**
     * Validate professional monthly application limit
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with professional ID
     * @returns {Promise<Boolean>} Whether professional can apply (under limit)
     */
    validateMonthlyApplicationLimit: async (parent, { professionalId }) => {
      try {
        // This would be implemented when JobApplication model is ready
        // For now, return true as placeholder
        const professional = await Professional.findById(professionalId);
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        // TODO: Implement actual monthly application count logic
        // const currentMonth = new Date().getMonth();
        // const currentYear = new Date().getFullYear();
        // const applicationCount = await JobApplication.countDocuments({
        //   professionalId,
        //   createdAt: {
        //     $gte: new Date(currentYear, currentMonth, 1),
        //     $lt: new Date(currentYear, currentMonth + 1, 1)
        //   }
        // });
        // return applicationCount < 3;
        
        return true;
      } catch (error) {
        throw new Error(`Error validating monthly application limit: ${error.message}`);
      }
    }
  },

  // Field resolvers
  Professional: {
    /**
     * Get active professions with populated data
     * @param {Object} parent - Professional document
     * @returns {Promise<Array>} Array of populated professions
     */
    activeProfessions: async (parent) => {
      try {
        return await parent.getActiveProfessions();
      } catch (error) {
        console.error('Error fetching active professions:', error);
        return [];
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
    },

    /**
     * Get monthly applications count
     * @param {Object} parent - Professional document
     * @returns {Promise<Number>} Count of applications this month
     */
    monthlyApplicationsCount: async (parent) => {
      try {
        // TODO: Implement when JobApplication model is ready
        // const JobApplication = require('../models/JobApplication');
        // const currentMonth = new Date().getMonth();
        // const currentYear = new Date().getFullYear();
        // return await JobApplication.countDocuments({
        //   professionalId: parent._id,
        //   createdAt: {
        //     $gte: new Date(currentYear, currentMonth, 1),
        //     $lt: new Date(currentYear, currentMonth + 1, 1)
        //   }
        // });
        return 0;
      } catch (error) {
        console.error('Error fetching monthly applications count:', error);
        return 0;
      }
    }
  }
};

module.exports = professionalResolvers;