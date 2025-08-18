/**
 * Profession GraphQL Resolvers
 * ITI-821 Advanced Database Course
 * 
 * Implements GraphQL resolvers for profession catalog operations
 */

const Profession = require('../../models/Profession');
const Professional = require('../../models/Professional');
const JobOffer = require('../../models/JobOffer');

const professionResolvers = {
  Query: {
    /**
     * Get all professions with optional filtering and sorting
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments
     * @returns {Promise<Array>} Array of professions
     */
    professions: async (parent, { filter, sort, limit, offset }) => {
      try {
        let query = {};
        
        // Apply filters
        if (filter) {
          if (filter.category) query.category = filter.category;
          if (filter.demandLevel) query.demandLevel = filter.demandLevel;
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          if (filter.searchText) {
            const searchRegex = new RegExp(filter.searchText, 'i');
            query.$or = [
              { name: searchRegex },
              { description: searchRegex },
              { skills: { $in: [searchRegex] } },
              { requirements: { $in: [searchRegex] } }
            ];
          }
        }
        
        // Build query
        let professionQuery = Profession.find(query);
        
        // Apply sorting
        if (sort) {
          const sortOrder = sort.order === 'DESC' ? -1 : 1;
          professionQuery = professionQuery.sort({ [sort.field]: sortOrder });
        } else {
          professionQuery = professionQuery.sort({ name: 1 });
        }
        
        // Apply pagination
        if (offset) professionQuery = professionQuery.skip(offset);
        if (limit) professionQuery = professionQuery.limit(limit);
        
        return await professionQuery.exec();
      } catch (error) {
        throw new Error(`Error fetching professions: ${error.message}`);
      }
    },

    /**
     * Get profession by ID
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with ID
     * @returns {Promise<Object>} Profession document
     */
    profession: async (parent, { id }) => {
      try {
        const profession = await Profession.findById(id);
        if (!profession) {
          throw new Error('Profession not found');
        }
        return profession;
      } catch (error) {
        throw new Error(`Error fetching profession: ${error.message}`);
      }
    },

    /**
     * Get profession by code
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with code
     * @returns {Promise<Object>} Profession document
     */
    professionByCode: async (parent, { code }) => {
      try {
        const profession = await Profession.findOne({ code: code.toUpperCase() });
        if (!profession) {
          throw new Error('Profession not found');
        }
        return profession;
      } catch (error) {
        throw new Error(`Error fetching profession by code: ${error.message}`);
      }
    },

    /**
     * Get professions by category
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with category
     * @returns {Promise<Array>} Array of professions
     */
    professionsByCategory: async (parent, { category }) => {
      try {
        return await Profession.findByCategory(category);
      } catch (error) {
        throw new Error(`Error fetching professions by category: ${error.message}`);
      }
    },

    /**
     * Get most popular professions
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with limit
     * @returns {Promise<Array>} Array of popular professions
     */
    popularProfessions: async (parent, { limit = 10 }) => {
      try {
        return await Profession.findPopular(limit);
      } catch (error) {
        throw new Error(`Error fetching popular professions: ${error.message}`);
      }
    },

    /**
     * Get professions by demand level
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with demand level
     * @returns {Promise<Array>} Array of professions
     */
    professionsByDemand: async (parent, { demandLevel }) => {
      try {
        return await Profession.findByDemand(demandLevel);
      } catch (error) {
        throw new Error(`Error fetching professions by demand: ${error.message}`);
      }
    },

    /**
     * Search professions by text
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with search text
     * @returns {Promise<Array>} Array of matching professions
     */
    searchProfessions: async (parent, { searchText }) => {
      try {
        return await Profession.searchByText(searchText);
      } catch (error) {
        throw new Error(`Error searching professions: ${error.message}`);
      }
    },

    /**
     * Get profession statistics by category
     * @returns {Promise<Array>} Aggregation result with statistics by category
     */
    professionStatsByCategory: async () => {
      try {
        const stats = await Profession.getStatsByCategory();

        return stats.map(s => ({
          category: s._id || "Desconocido",   // mapear _id → category
          count: s.count,
          totalProfessionals: s.totalProfessionals,
          totalJobOffers: s.totalJobOffers,
          averageSalaryMin: s.averageSalaryMin,
          averageSalaryMax: s.averageSalaryMax
        }));
      } catch (error) {
        throw new Error(`Error fetching profession stats by category: ${error.message}`);
      }
    },

    /**
     * Get total professions count
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with optional filter
     * @returns {Promise<Number>} Total count
     */
    professionsCount: async (parent, { filter }) => {
      try {
        let query = {};
        
        if (filter) {
          if (filter.category) query.category = filter.category;
          if (filter.demandLevel) query.demandLevel = filter.demandLevel;
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          if (filter.searchText) {
            const searchRegex = new RegExp(filter.searchText, 'i');
            query.$or = [
              { name: searchRegex },
              { description: searchRegex },
              { skills: { $in: [searchRegex] } },
              { requirements: { $in: [searchRegex] } }
            ];
          }
        }
        
        return await Profession.countDocuments(query);
      } catch (error) {
        throw new Error(`Error counting professions: ${error.message}`);
      }
    }
  },

  Mutation: {
    /**
     * Create new profession
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with input data
     * @returns {Promise<Object>} Created profession document
     */
    createProfession: async (parent, { input }) => {
      try {
        const profession = new Profession(input);
        return await profession.save();
      } catch (error) {
        if (error.code === 11000) {
          throw new Error('Profession with this name or code already exists');
        }
        throw new Error(`Error creating profession: ${error.message}`);
      }
    },

    /**
     * Update profession
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and input data
     * @returns {Promise<Object>} Updated profession document
     */
    updateProfession: async (parent, { id, input }) => {
      try {
        const profession = await Profession.findByIdAndUpdate(
          id,
          { ...input, lastUpdated: new Date() },
          { new: true, runValidators: true }
        );
        
        if (!profession) {
          throw new Error('Profession not found');
        }
        
        return profession;
      } catch (error) {
        throw new Error(`Error updating profession: ${error.message}`);
      }
    },

    /**
     * Delete profession (soft delete)
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Boolean>} Success status
     */
    deleteProfession: async (parent, { id }) => {
      try {
        const profession = await Profession.findByIdAndUpdate(
          id,
          { isActive: false, lastUpdated: new Date() },
          { new: true }
        );
        
        return !!profession;
      } catch (error) {
        throw new Error(`Error deleting profession: ${error.message}`);
      }
    },

    /**
     * Add requirement to profession
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and requirement
     * @returns {Promise<Object>} Updated profession document
     */
    addProfessionRequirement: async (parent, { id, requirement }) => {
      try {
        const profession = await Profession.findById(id);
        if (!profession) {
          throw new Error('Profession not found');
        }
        
        return await profession.addRequirement(requirement);
      } catch (error) {
        throw new Error(`Error adding requirement: ${error.message}`);
      }
    },

    /**
     * Remove requirement from profession
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and requirement
     * @returns {Promise<Object>} Updated profession document
     */
    removeProfessionRequirement: async (parent, { id, requirement }) => {
      try {
        const profession = await Profession.findById(id);
        if (!profession) {
          throw new Error('Profession not found');
        }
        
        profession.requirements = profession.requirements.filter(req => req !== requirement);
        profession.lastUpdated = new Date();
        
        return await profession.save();
      } catch (error) {
        throw new Error(`Error removing requirement: ${error.message}`);
      }
    },

    /**
     * Add skill to profession
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and skill
     * @returns {Promise<Object>} Updated profession document
     */
    addProfessionSkill: async (parent, { id, skill }) => {
      try {
        const profession = await Profession.findById(id);
        if (!profession) {
          throw new Error('Profession not found');
        }
        
        return await profession.addSkill(skill);
      } catch (error) {
        throw new Error(`Error adding skill: ${error.message}`);
      }
    },

    /**
     * Remove skill from profession
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and skill
     * @returns {Promise<Object>} Updated profession document
     */
    removeProfessionSkill: async (parent, { id, skill }) => {
      try {
        const profession = await Profession.findById(id);
        if (!profession) {
          throw new Error('Profession not found');
        }
        
        profession.skills = profession.skills.filter(s => s !== skill);
        profession.lastUpdated = new Date();
        
        return await profession.save();
      } catch (error) {
        throw new Error(`Error removing skill: ${error.message}`);
      }
    },

    /**
     * Update profession statistics
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated profession document
     */
    updateProfessionStats: async (parent, { id }) => {
      try {
        const profession = await Profession.findById(id);
        if (!profession) {
          throw new Error('Profession not found');
        }
        
        return await profession.updateStatistics();
      } catch (error) {
        throw new Error(`Error updating profession statistics: ${error.message}`);
      }
    },

    /**
     * Bulk update all profession statistics
     * @returns {Promise<Array>} Array of updated professions
     */
    updateAllProfessionStats: async () => {
      try {
        const professions = await Profession.find({ isActive: true });
        const updatedProfessions = [];
        
        for (const profession of professions) {
          try {
            const updated = await profession.updateStatistics();
            updatedProfessions.push(updated);
          } catch (error) {
            console.error(`Error updating stats for profession ${profession.name}:`, error);
          }
        }
        
        return updatedProfessions;
      } catch (error) {
        throw new Error(`Error updating all profession statistics: ${error.message}`);
      }
    },

    /**
     * Toggle profession active status
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated profession document
     */
    toggleProfessionStatus: async (parent, { id }) => {
      try {
        const profession = await Profession.findById(id);
        if (!profession) {
          throw new Error('Profession not found');
        }
        
        profession.isActive = !profession.isActive;
        profession.lastUpdated = new Date();
        
        return await profession.save();
      } catch (error) {
        throw new Error(`Error toggling profession status: ${error.message}`);
      }
    }
  }
};

module.exports = professionResolvers;