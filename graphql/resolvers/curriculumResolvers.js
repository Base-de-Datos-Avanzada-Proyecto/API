/**
 * Curriculum GraphQL Resolvers
 * ITI-821 Advanced Database Course
 * 
 * Implements GraphQL resolvers for curriculum operations
 * Works with Curriculum model for digital resume management
 */

const Curriculum = require('../../models/Curriculum');
const Professional = require('../../models/Professional');
const Profession = require('../../models/Profession');
const mongoose = require('mongoose');

const curriculumResolvers = {
  Query: {
    /**
     * Get all curricula with optional filtering and sorting
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments
     * @returns {Promise<Array>} Array of curricula
     */
    curricula: async (parent, { filter, sort, limit, offset }) => {
      try {
        let query = {};
        
        // Apply filters
        if (filter) {
          if (filter.professionalId) query.professionalId = filter.professionalId;
          if (filter.isComplete !== undefined) query.isComplete = filter.isComplete;
          if (filter.isPublic !== undefined) query.isPublic = filter.isPublic;
          
          if (filter.professionId) {
            query['professions.professionId'] = filter.professionId;
          }
          
          if (filter.educationLevel) {
            query['education.educationLevel'] = filter.educationLevel;
          }
          
          if (filter.skillCategory) {
            query['skills.category'] = filter.skillCategory;
          }
          
          if (filter.hasWorkExperience !== undefined) {
            if (filter.hasWorkExperience) {
              query['workExperience.0'] = { $exists: true };
            } else {
              query.workExperience = { $size: 0 };
            }
          }
          
          if (filter.minExperienceYears || filter.maxExperienceYears) {
            const experienceQuery = {};
            if (filter.minExperienceYears) {
              experienceQuery.$gte = filter.minExperienceYears;
            }
            if (filter.maxExperienceYears) {
              experienceQuery.$lte = filter.maxExperienceYears;
            }
            query['professions.experienceYears'] = experienceQuery;
          }
          
          if (filter.searchText) {
            const searchRegex = new RegExp(filter.searchText, 'i');
            query.$or = [
              { summary: searchRegex },
              { objectives: searchRegex },
              { 'education.institution': searchRegex },
              { 'education.degree': searchRegex },
              { 'workExperience.company': searchRegex },
              { 'workExperience.position': searchRegex },
              { 'skills.name': searchRegex }
            ];
          }
        }
        
        // Build query
        let curriculumQuery = Curriculum.find(query)
          .populate('professionalId')
          .populate('professions.professionId');
        
        // Apply sorting
        if (sort) {
          const sortOrder = sort.order === 'DESC' ? -1 : 1;
          curriculumQuery = curriculumQuery.sort({ [sort.field]: sortOrder });
        } else {
          curriculumQuery = curriculumQuery.sort({ updatedAt: -1 });
        }
        
        // Apply pagination
        if (offset) curriculumQuery = curriculumQuery.skip(offset);
        if (limit) curriculumQuery = curriculumQuery.limit(limit);
        
        return await curriculumQuery.exec();
      } catch (error) {
        throw new Error(`Error fetching curricula: ${error.message}`);
      }
    },

    /**
     * Get curriculum by ID
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with ID
     * @returns {Promise<Object>} Curriculum document
     */
    curriculum: async (parent, { id }) => {
      try {
        const curriculum = await Curriculum.findById(id)
          .populate('professionalId')
          .populate('professions.professionId');
        
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        return curriculum;
      } catch (error) {
        throw new Error(`Error fetching curriculum: ${error.message}`);
      }
    },

    /**
     * Get curriculum by professional ID
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with professional ID
     * @returns {Promise<Object>} Curriculum document
     */
    curriculumByProfessional: async (parent, { professionalId }) => {
      try {
        const curriculum = await Curriculum.findOne({ professionalId })
          .populate('professionalId')
          .populate('professions.professionId');
        
        if (!curriculum) {
          throw new Error('Curriculum not found for this professional');
        }
        
        return curriculum;
      } catch (error) {
        throw new Error(`Error fetching curriculum by professional: ${error.message}`);
      }
    },

    /**
     * Get curricula by profession
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with profession ID
     * @returns {Promise<Array>} Array of curricula
     */
    curriculaByProfession: async (parent, { professionId }) => {
      try {
        return await Curriculum.findByProfession(professionId);
      } catch (error) {
        throw new Error(`Error fetching curricula by profession: ${error.message}`);
      }
    },

    /**
     * Get curricula by education level
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with education level
     * @returns {Promise<Array>} Array of curricula
     */
    curriculaByEducationLevel: async (parent, { educationLevel }) => {
      try {
        return await Curriculum.findByEducationLevel(educationLevel);
      } catch (error) {
        throw new Error(`Error fetching curricula by education level: ${error.message}`);
      }
    },

    /**
     * Get curricula by skill category
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with skill category
     * @returns {Promise<Array>} Array of curricula
     */
    curriculaBySkillCategory: async (parent, { category }) => {
      try {
        return await Curriculum.find({
          'skills.category': category,
          isPublic: true,
          isComplete: true
        })
        .populate('professionalId')
        .populate('professions.professionId')
        .sort({ updatedAt: -1 });
      } catch (error) {
        throw new Error(`Error fetching curricula by skill category: ${error.message}`);
      }
    },

    /**
     * Get completed curricula
     * @returns {Promise<Array>} Array of completed curricula
     */
    completedCurricula: async () => {
      try {
        return await Curriculum.find({ isComplete: true })
          .populate('professionalId')
          .populate('professions.professionId')
          .sort({ updatedAt: -1 });
      } catch (error) {
        throw new Error(`Error fetching completed curricula: ${error.message}`);
      }
    },

    /**
     * Get public curricula
     * @returns {Promise<Array>} Array of public curricula
     */
    publicCurricula: async () => {
      try {
        return await Curriculum.find({ isPublic: true, isComplete: true })
          .populate('professionalId')
          .populate('professions.professionId')
          .sort({ updatedAt: -1 });
      } catch (error) {
        throw new Error(`Error fetching public curricula: ${error.message}`);
      }
    },

    /**
     * Search curricula by text
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with search text
     * @returns {Promise<Array>} Array of matching curricula
     */
    searchCurricula: async (parent, { searchText }) => {
      try {
        const searchRegex = new RegExp(searchText, 'i');
        
        return await Curriculum.find({
          isPublic: true,
          isComplete: true,
          $or: [
            { summary: searchRegex },
            { objectives: searchRegex },
            { 'education.institution': searchRegex },
            { 'education.degree': searchRegex },
            { 'workExperience.company': searchRegex },
            { 'workExperience.position': searchRegex },
            { 'skills.name': searchRegex }
          ]
        })
        .populate('professionalId')
        .populate('professions.professionId')
        .sort({ updatedAt: -1 });
      } catch (error) {
        throw new Error(`Error searching curricula: ${error.message}`);
      }
    },

    /**
     * Get curricula statistics by profession
     * @returns {Promise<Array>} Array of profession statistics
     */
    curriculaProfessionStats: async () => {
      try {
        return await Curriculum.getProfessionStats();
      } catch (error) {
        throw new Error(`Error fetching profession stats: ${error.message}`);
      }
    },

    /**
     * Get curricula statistics by education level
     * @returns {Promise<Array>} Array of education statistics
     */
    curriculaEducationStats: async () => {
      try {
        const stats = await Curriculum.aggregate([
          { $match: { isComplete: true } },
          { $unwind: '$education' },
          {
            $group: {
              _id: '$education.educationLevel',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]);
        
        const total = stats.reduce((sum, stat) => sum + stat.count, 0);
        
        return stats.map(stat => ({
          educationLevel: stat._id,
          count: stat.count,
          percentage: parseFloat(((stat.count / total) * 100).toFixed(2))
        }));
      } catch (error) {
        throw new Error(`Error fetching education stats: ${error.message}`);
      }
    },

    /**
     * Get curricula statistics by skill category
     * @returns {Promise<Array>} Array of skill statistics
     */
    curriculaSkillStats: async () => {
      try {
        const stats = await Curriculum.aggregate([
          { $match: { isComplete: true } },
          { $unwind: '$skills' },
          {
            $group: {
              _id: '$skills.category',
              count: { $sum: 1 },
              avgYears: { $avg: '$skills.yearsOfExperience' }
            }
          },
          { $sort: { count: -1 } }
        ]);
        
        return stats.map(stat => ({
          category: stat._id,
          count: stat.count,
          avgYears: parseFloat(stat.avgYears.toFixed(1))
        }));
      } catch (error) {
        throw new Error(`Error fetching skill stats: ${error.message}`);
      }
    },

    /**
     * Get total curricula count
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with optional filter
     * @returns {Promise<Number>} Total count
     */
    curriculaCount: async (parent, { filter }) => {
      try {
        let query = {};
        
        if (filter) {
          if (filter.professionalId) query.professionalId = filter.professionalId;
          if (filter.isComplete !== undefined) query.isComplete = filter.isComplete;
          if (filter.isPublic !== undefined) query.isPublic = filter.isPublic;
          if (filter.professionId) query['professions.professionId'] = filter.professionId;
          if (filter.educationLevel) query['education.educationLevel'] = filter.educationLevel;
        }
        
        return await Curriculum.countDocuments(query);
      } catch (error) {
        throw new Error(`Error counting curricula: ${error.message}`);
      }
    },

    /**
     * Get curricula by experience range
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with experience range
     * @returns {Promise<Array>} Array of curricula in experience range
     */
    curriculaByExperienceRange: async (parent, { minYears, maxYears }) => {
      try {
        return await Curriculum.find({
          isPublic: true,
          isComplete: true,
          'professions.experienceYears': { $gte: minYears, $lte: maxYears }
        })
        .populate('professionalId')
        .populate('professions.professionId')
        .sort({ 'professions.experienceYears': -1 });
      } catch (error) {
        throw new Error(`Error fetching curricula by experience range: ${error.message}`);
      }
    },

    /**
     * Get recently updated curricula
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with optional limit
     * @returns {Promise<Array>} Array of recently updated curricula
     */
    recentlyUpdatedCurricula: async (parent, { limit = 10 }) => {
      try {
        return await Curriculum.find({ isPublic: true, isComplete: true })
          .populate('professionalId')
          .populate('professions.professionId')
          .sort({ updatedAt: -1 })
          .limit(limit);
      } catch (error) {
        throw new Error(`Error fetching recently updated curricula: ${error.message}`);
      }
    },

    /**
     * Get curricula requiring review
     * @returns {Promise<Array>} Array of curricula needing review
     */
    curriculaRequiringReview: async () => {
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        return await Curriculum.find({
          isComplete: true,
          $or: [
            { lastReviewed: { $lt: sixMonthsAgo } },
            { lastReviewed: null }
          ]
        })
        .populate('professionalId')
        .populate('professions.professionId')
        .sort({ lastReviewed: 1 });
      } catch (error) {
        throw new Error(`Error fetching curricula requiring review: ${error.message}`);
      }
    }
  },

  Mutation: {
    /**
     * Create new curriculum
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with input data
     * @returns {Promise<Object>} Created curriculum document
     */
    createCurriculum: async (parent, { input }) => {
      try {
        // Check if professional exists
        const professional = await Professional.findById(input.professionalId);
        if (!professional) {
          throw new Error('Professional not found');
        }
        
        // Check if curriculum already exists for this professional
        const existingCurriculum = await Curriculum.findOne({ professionalId: input.professionalId });
        if (existingCurriculum) {
          throw new Error('Curriculum already exists for this professional');
        }
        
        const curriculum = new Curriculum(input);
        const savedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(savedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error creating curriculum: ${error.message}`);
      }
    },

    /**
     * Update curriculum
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and input data
     * @returns {Promise<Object>} Updated curriculum document
     */
    updateCurriculum: async (parent, { id, input }) => {
      try {
        const curriculum = await Curriculum.findByIdAndUpdate(
          id,
          input,
          { new: true, runValidators: true }
        )
        .populate('professionalId')
        .populate('professions.professionId');
        
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        return curriculum;
      } catch (error) {
        throw new Error(`Error updating curriculum: ${error.message}`);
      }
    },

    /**
     * Delete curriculum (soft delete)
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Boolean>} Success status
     */
    deleteCurriculum: async (parent, { id }) => {
      try {
        const curriculum = await Curriculum.findByIdAndUpdate(
          id,
          { isPublic: false },
          { new: true }
        );
        
        return !!curriculum;
      } catch (error) {
        throw new Error(`Error deleting curriculum: ${error.message}`);
      }
    },

    /**
     * Add profession to curriculum
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    addProfessionToCurriculum: async (parent, { id, professionId, experienceYears, proficiencyLevel }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        const options = {};
        if (experienceYears !== undefined) options.experienceYears = experienceYears;
        if (proficiencyLevel) options.proficiencyLevel = proficiencyLevel;
        
        const updatedCurriculum = await curriculum.addProfession(professionId, options);
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error adding profession to curriculum: ${error.message}`);
      }
    },

    /**
     * Remove profession from curriculum
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    removeProfessionFromCurriculum: async (parent, { id, professionId }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        const updatedCurriculum = await curriculum.removeProfession(professionId);
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error removing profession from curriculum: ${error.message}`);
      }
    },

    /**
     * Add education entry
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    addEducationEntry: async (parent, { id, education }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.education.push(education);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error adding education entry: ${error.message}`);
      }
    },

    /**
     * Update education entry
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    updateEducationEntry: async (parent, { id, educationId, education }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        const educationEntry = curriculum.education.id(educationId);
        if (!educationEntry) {
          throw new Error('Education entry not found');
        }
        
        Object.assign(educationEntry, education);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error updating education entry: ${error.message}`);
      }
    },

    /**
     * Remove education entry
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    removeEducationEntry: async (parent, { id, educationId }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.education.pull({ _id: educationId });
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error removing education entry: ${error.message}`);
      }
    },

    /**
     * Add work experience entry
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    addWorkExperienceEntry: async (parent, { id, experience }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.workExperience.push(experience);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error adding work experience entry: ${error.message}`);
      }
    },

    /**
     * Update work experience entry
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    updateWorkExperienceEntry: async (parent, { id, experienceId, experience }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        const workEntry = curriculum.workExperience.id(experienceId);
        if (!workEntry) {
          throw new Error('Work experience entry not found');
        }
        
        Object.assign(workEntry, experience);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error updating work experience entry: ${error.message}`);
      }
    },

    /**
     * Remove work experience entry
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    removeWorkExperienceEntry: async (parent, { id, experienceId }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.workExperience.pull({ _id: experienceId });
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error removing work experience entry: ${error.message}`);
      }
    },

    /**
     * Add certification
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    addCertification: async (parent, { id, certification }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.certifications.push(certification);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error adding certification: ${error.message}`);
      }
    },

    /**
     * Update certification
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    updateCertification: async (parent, { id, certificationId, certification }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        const certEntry = curriculum.certifications.id(certificationId);
        if (!certEntry) {
          throw new Error('Certification not found');
        }
        
        Object.assign(certEntry, certification);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error updating certification: ${error.message}`);
      }
    },

    /**
     * Remove certification
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    removeCertification: async (parent, { id, certificationId }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.certifications.pull({ _id: certificationId });
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error removing certification: ${error.message}`);
      }
    },

    /**
     * Add skill
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    addSkill: async (parent, { id, skill }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        // Check if skill already exists
        const existingSkill = curriculum.skills.find(s => s.name.toLowerCase() === skill.name.toLowerCase());
        if (existingSkill) {
          throw new Error('Skill already exists in curriculum');
        }
        
        curriculum.skills.push(skill);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error adding skill: ${error.message}`);
      }
    },

    /**
     * Update skill
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    updateSkill: async (parent, { id, skillName, skill }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        const skillEntry = curriculum.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
        if (!skillEntry) {
          throw new Error('Skill not found');
        }
        
        Object.assign(skillEntry, skill);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error updating skill: ${error.message}`);
      }
    },

    /**
     * Remove skill
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    removeSkill: async (parent, { id, skillName }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.skills = curriculum.skills.filter(s => s.name.toLowerCase() !== skillName.toLowerCase());
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error removing skill: ${error.message}`);
      }
    },

    /**
     * Add language
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    addLanguage: async (parent, { id, language }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        // Check if language already exists
        const existingLanguage = curriculum.languages.find(l => l.language.toLowerCase() === language.language.toLowerCase());
        if (existingLanguage) {
          throw new Error('Language already exists in curriculum');
        }
        
        curriculum.languages.push(language);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error adding language: ${error.message}`);
      }
    },

    /**
     * Update language
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    updateLanguage: async (parent, { id, languageName, language }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        const languageEntry = curriculum.languages.find(l => l.language.toLowerCase() === languageName.toLowerCase());
        if (!languageEntry) {
          throw new Error('Language not found');
        }
        
        Object.assign(languageEntry, language);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error updating language: ${error.message}`);
      }
    },

    /**
     * Remove language
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    removeLanguage: async (parent, { id, languageName }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.languages = curriculum.languages.filter(l => l.language.toLowerCase() !== languageName.toLowerCase());
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error removing language: ${error.message}`);
      }
    },

    /**
     * Update portfolio
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    updatePortfolio: async (parent, { id, portfolio }) => {
      try {
        const curriculum = await Curriculum.findByIdAndUpdate(
          id,
          { portfolio },
          { new: true, runValidators: true }
        )
        .populate('professionalId')
        .populate('professions.professionId');
        
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        return curriculum;
      } catch (error) {
        throw new Error(`Error updating portfolio: ${error.message}`);
      }
    },

    /**
     * Add reference
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    addReference: async (parent, { id, reference }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.references.push(reference);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error adding reference: ${error.message}`);
      }
    },

    /**
     * Update reference
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    updateReference: async (parent, { id, referenceId, reference }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        const refEntry = curriculum.references.id(referenceId);
        if (!refEntry) {
          throw new Error('Reference not found');
        }
        
        Object.assign(refEntry, reference);
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error updating reference: ${error.message}`);
      }
    },

    /**
     * Remove reference
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    removeReference: async (parent, { id, referenceId }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.references.pull({ _id: referenceId });
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error removing reference: ${error.message}`);
      }
    },

    /**
     * Mark curriculum as complete
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    markCurriculumAsComplete: async (parent, { id }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        const completedCurriculum = await curriculum.markAsComplete();
        
        return await Curriculum.findById(completedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error marking curriculum as complete: ${error.message}`);
      }
    },

    /**
     * Toggle curriculum visibility
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    toggleCurriculumVisibility: async (parent, { id }) => {
      try {
        const curriculum = await Curriculum.findById(id);
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        curriculum.isPublic = !curriculum.isPublic;
        const updatedCurriculum = await curriculum.save();
        
        return await Curriculum.findById(updatedCurriculum._id)
          .populate('professionalId')
          .populate('professions.professionId');
      } catch (error) {
        throw new Error(`Error toggling curriculum visibility: ${error.message}`);
      }
    },

    /**
     * Update curriculum summary and objectives
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    updateCurriculumSummary: async (parent, { id, summary, objectives }) => {
      try {
        const updateData = {};
        if (summary !== undefined) updateData.summary = summary;
        if (objectives !== undefined) updateData.objectives = objectives;
        
        const curriculum = await Curriculum.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        )
        .populate('professionalId')
        .populate('professions.professionId');
        
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        return curriculum;
      } catch (error) {
        throw new Error(`Error updating curriculum summary: ${error.message}`);
      }
    },

    /**
     * Review curriculum (update lastReviewed date)
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments
     * @returns {Promise<Object>} Updated curriculum document
     */
    reviewCurriculum: async (parent, { id }) => {
      try {
        const curriculum = await Curriculum.findByIdAndUpdate(
          id,
          { lastReviewed: new Date() },
          { new: true }
        )
        .populate('professionalId')
        .populate('professions.professionId');
        
        if (!curriculum) {
          throw new Error('Curriculum not found');
        }
        
        return curriculum;
      } catch (error) {
        throw new Error(`Error reviewing curriculum: ${error.message}`);
      }
    }
  },

  // Field resolvers
  Curriculum: {
    /**
     * Get professional for the curriculum
     * @param {Object} parent - Curriculum document
     * @returns {Promise<Object>} Professional document
     */
    professional: async (parent) => {
      try {
        const Professional = require('../../models/Professional');
        return await Professional.findById(parent.professionalId);
      } catch (error) {
        console.error('Error fetching professional:', error);
        return null;
      }
    }
  },

  CurriculumProfession: {
    /**
     * Get profession details
     * @param {Object} parent - CurriculumProfession subdocument
     * @returns {Promise<Object>} Profession document
     */
    professionId: async (parent) => {
      try {
        return await Profession.findById(parent.professionId);
      } catch (error) {
        console.error('Error fetching profession:', error);
        return null;
      }
    }
  }
};

module.exports = curriculumResolvers;