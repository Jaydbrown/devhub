import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all developers with filters
export const getAllDevelopers = async (req, res, next) => {
  try {
    const { skill, location, rating, search, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT d.*, u.full_name, u.email 
      FROM developers d 
      JOIN users u ON d.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (skill) {
      queryText += ` AND d.skills ILIKE $${paramCount}`;
      params.push(`%${skill}%`);
      paramCount++;
    }

    if (location) {
      queryText += ` AND d.location ILIKE $${paramCount}`;
      params.push(`%${location}%`);
      paramCount++;
    }

    if (rating) {
      queryText += ` AND d.rating >= $${paramCount}`;
      params.push(rating);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (u.full_name ILIKE $${paramCount} OR d.username ILIKE $${paramCount} OR d.skills ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ` ORDER BY d.rating DESC, d.total_reviews DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      developers: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get single developer by ID
export const getDeveloperById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const devResult = await query(
      `SELECT d.*, u.full_name, u.email, u.phone 
       FROM developers d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.id = $1`,
      [id]
    );

    if (devResult.rows.length === 0) {
      throw new AppError('Developer not found', 404);
    }

    const developer = devResult.rows[0];

    // Get reviews
    const reviewsResult = await query(
      `SELECT r.*, u.full_name as author_name 
       FROM reviews r 
       JOIN users u ON r.client_id = u.id 
       WHERE r.developer_id = $1 
       ORDER BY r.created_at DESC`,
      [id]
    );

    developer.reviews = reviewsResult.rows;

    // Get recent projects
    const projectsResult = await query(
      `SELECT id, title, status, budget, created_at 
       FROM projects 
       WHERE developer_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [id]
    );

    developer.projects = projectsResult.rows;

    res.json({ developer });
  } catch (error) {
    next(error);
  }
};

// Update developer profile
export const updateDeveloper = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      username,
      bio,
      skills,
      experienceLevel,
      yearsExperience,
      portfolioUrl,
      location,
      hourlyRate,
    } = req.body;

    const ownerCheck = await query('SELECT user_id FROM developers WHERE id = $1', [id]);
    if (ownerCheck.rows.length === 0) {
      throw new AppError('Developer not found', 404);
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      throw new AppError('Unauthorized to update this profile', 403);
    }

    const result = await query(
      `UPDATE developers 
       SET username = COALESCE($1, username),
           bio = COALESCE($2, bio),
           skills = COALESCE($3, skills),
           experience_level = COALESCE($4, experience_level),
           years_experience = COALESCE($5, years_experience),
           portfolio_url = COALESCE($6, portfolio_url),
           location = COALESCE($7, location),
           hourly_rate = COALESCE($8, hourly_rate)
       WHERE id = $9 
       RETURNING *`,
      [username, bio, skills, experienceLevel, yearsExperience, portfolioUrl, location, hourlyRate, id]
    );

    res.json({
      message: 'Profile updated successfully',
      developer: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete developer profile
export const deleteDeveloper = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ownerCheck = await query('SELECT user_id FROM developers WHERE id = $1', [id]);
    if (ownerCheck.rows.length === 0) {
      throw new AppError('Developer not found', 404);
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      throw new AppError('Unauthorized to delete this profile', 403);
    }

    await query('DELETE FROM developers WHERE id = $1', [id]);

    res.json({ message: 'Developer profile deleted successfully' });
  } catch (error) {
    next(error);
  }
};
