import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all projects with filters
export const getAllProjects = async (req, res, next) => {
  try {
    const { status, clientId, developerId, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT p.*, 
             u.full_name AS client_name,
             d.username AS developer_name
      FROM projects p 
      JOIN users u ON p.client_id = u.id 
      LEFT JOIN developers d ON p.developer_id = d.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (clientId) {
      queryText += ` AND p.client_id = $${paramCount}`;
      params.push(clientId);
      paramCount++;
    }

    if (developerId) {
      queryText += ` AND p.developer_id = $${paramCount}`;
      params.push(developerId);
      paramCount++;
    }

    queryText += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      projects: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get single project by ID
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*, 
              u.full_name AS client_name,
              u.email AS client_email,
              d.username AS developer_name,
              d.hourly_rate AS developer_rate
       FROM projects p 
       JOIN users u ON p.client_id = u.id 
       LEFT JOIN developers d ON p.developer_id = d.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Create new project
export const createProject = async (req, res, next) => {
  try {
    const { title, description, budget, deadline, developerId } = req.body;
    const clientId = req.user.id;

    if (req.user.userType !== 'Client') {
      throw new AppError('Only clients can create projects', 403);
    }

    const result = await query(
      `INSERT INTO projects (title, description, budget, deadline, client_id, developer_id, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW()) 
       RETURNING *`,
      [title, description, budget || null, deadline || null, clientId, developerId || null]
    );

    res.status(201).json({
      message: 'Project created successfully',
      project: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update project
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, budget, deadline, status, developerId } = req.body;

    const projectCheck = await query('SELECT client_id FROM projects WHERE id = $1', [id]);

    if (projectCheck.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    if (projectCheck.rows[0].client_id !== req.user.id) {
      throw new AppError('Unauthorized to update this project', 403);
    }

    const result = await query(
      `UPDATE projects 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           budget = COALESCE($3, budget),
           deadline = COALESCE($4, deadline),
           status = COALESCE($5, status),
           developer_id = COALESCE($6, developer_id)
       WHERE id = $7 
       RETURNING *`,
      [title, description, budget, deadline, status, developerId, id]
    );

    res.json({
      message: 'Project updated successfully',
      project: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete project
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const projectCheck = await query('SELECT client_id FROM projects WHERE id = $1', [id]);

    if (projectCheck.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    if (projectCheck.rows[0].client_id !== req.user.id) {
      throw new AppError('Unauthorized to delete this project', 403);
    }

    await query('DELETE FROM projects WHERE id = $1', [id]);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};
