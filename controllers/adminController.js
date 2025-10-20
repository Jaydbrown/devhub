import { query } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";

// ==================== DASHBOARD STATS ====================

export const getDashboardStats = async (req, res, next) => {
  try {
    const usersResult = await query("SELECT COUNT(*) as total FROM users");
    const devsResult = await query("SELECT COUNT(*) as total FROM developers");
    const clientsResult = await query("SELECT COUNT(*) as total FROM clients");
    const projectsResult = await query("SELECT COUNT(*) as total FROM projects");
    const activeProjectsResult = await query(
      `SELECT COUNT(*) as total FROM projects WHERE status = 'in-progress'`
    );
    const revenueResult = await query(
      `SELECT COALESCE(SUM(budget), 0) as total FROM projects WHERE status = 'completed'`
    );
    const reviewsResult = await query("SELECT COUNT(*) as total FROM reviews");
    const avgRatingResult = await query(
      "SELECT AVG(rating) as avg FROM developers WHERE total_reviews > 0"
    );
    const newUsersResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE created_at >= date_trunc('month', CURRENT_DATE)`
    );
    const newProjectsResult = await query(
      `SELECT COUNT(*) as total FROM projects WHERE created_at >= date_trunc('month', CURRENT_DATE)`
    );

    res.json({
      totalUsers: parseInt(usersResult.rows[0].total),
      totalDevelopers: parseInt(devsResult.rows[0].total),
      totalClients: parseInt(clientsResult.rows[0].total),
      totalProjects: parseInt(projectsResult.rows[0].total),
      activeProjects: parseInt(activeProjectsResult.rows[0].total),
      totalRevenue: parseFloat(revenueResult.rows[0].total).toFixed(2),
      totalReviews: parseInt(reviewsResult.rows[0].total),
      avgRating: parseFloat(avgRatingResult.rows[0].avg || 0).toFixed(2),
      newUsersThisMonth: parseInt(newUsersResult.rows[0].total),
      newProjectsThisMonth: parseInt(newProjectsResult.rows[0].total),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== USER MANAGEMENT ====================

export const getAllUsers = async (req, res, next) => {
  try {
    const { userType, search, limit = 50, offset = 0 } = req.query;

    let queryText = "SELECT * FROM users WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (userType) {
      queryText += ` AND user_type = $${paramCount}`;
      params.push(userType);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      users: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userCheck = await query("SELECT * FROM users WHERE id = $1", [id]);

    if (userCheck.rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    await query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { suspended } = req.body;

    await query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false"
    );

    const result = await query(
      "UPDATE users SET suspended = $1 WHERE id = $2 RETURNING *",
      [suspended, id]
    );

    if (result.rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    res.json({
      message: `User ${suspended ? "suspended" : "activated"} successfully`,
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PROJECT MANAGEMENT ====================

export const getAllProjectsAdmin = async (req, res, next) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT p.*, 
             c.full_name as client_name,
             d.username as developer_name
      FROM projects p
      LEFT JOIN users c ON p.client_id = c.id
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

    if (search) {
      queryText += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
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

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM projects WHERE id = $1", [id]);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ==================== REVIEW MANAGEMENT ====================

export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT r.*, 
              d.username as developer_name,
              u.full_name as client_name
       FROM reviews r
       JOIN developers d ON r.developer_id = d.id
       JOIN users u ON r.client_id = u.id
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      reviews: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviewResult = await query("SELECT developer_id FROM reviews WHERE id = $1", [id]);

    if (reviewResult.rows.length === 0) {
      throw new AppError("Review not found", 404);
    }

    const developerId = reviewResult.rows[0].developer_id;
    await query("DELETE FROM reviews WHERE id = $1", [id]);

    const avgResult = await query(
      "SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE developer_id = $1",
      [developerId]
    );

    const newRating =
      avgResult.rows[0].total > 0
        ? parseFloat(avgResult.rows[0].avg_rating).toFixed(2)
        : 0;

    await query(
      "UPDATE developers SET rating = $1, total_reviews = $2 WHERE id = $3",
      [newRating, avgResult.rows[0].total, developerId]
    );

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ==================== ANALYTICS ====================

export const getAnalytics = async (req, res, next) => {
  try {
    const { period = "30" } = req.query;

    const userGrowth = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    const projectTrend = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM projects
       WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    const revenueTrend = await query(
      `SELECT DATE(created_at) as date, SUM(budget) as revenue
       FROM projects
       WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '${period} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    const topDevelopers = await query(
      `SELECT d.id, d.username, u.full_name, d.rating, d.total_reviews,
              COUNT(p.id) as total_projects
       FROM developers d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN projects p ON d.id = p.developer_id
       GROUP BY d.id, d.username, u.full_name, d.rating, d.total_reviews
       ORDER BY d.rating DESC, d.total_reviews DESC
       LIMIT 10`
    );

    const topClients = await query(
      `SELECT u.id, u.full_name, u.email,
              COUNT(p.id) as total_projects,
              SUM(p.budget) as total_spent
       FROM users u
       LEFT JOIN projects p ON u.id = p.client_id
       WHERE u.user_type = 'Client'
       GROUP BY u.id, u.full_name, u.email
       ORDER BY total_spent DESC
       LIMIT 10`
    );

    res.json({
      userGrowth: userGrowth.rows,
      projectTrend: projectTrend.rows,
      revenueTrend: revenueTrend.rows,
      topDevelopers: topDevelopers.rows,
      topClients: topClients.rows,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SETTINGS ====================

export const updateSettings = async (req, res, next) => {
  try {
    const { platformFee, minProjectBudget, maxProjectBudget } = req.body;

    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (platformFee !== undefined) {
      await query(
        `INSERT INTO settings (key, value) VALUES ('platform_fee', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
        [platformFee]
      );
    }

    if (minProjectBudget !== undefined) {
      await query(
        `INSERT INTO settings (key, value) VALUES ('min_project_budget', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
        [minProjectBudget]
      );
    }

    if (maxProjectBudget !== undefined) {
      await query(
        `INSERT INTO settings (key, value) VALUES ('max_project_budget', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
        [maxProjectBudget]
      );
    }

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM settings");

    const settings = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (error) {
    next(error);
  }
};
