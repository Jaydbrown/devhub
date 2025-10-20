import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get client statistics
export const getClientStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify user is accessing their own stats
    if (parseInt(id) !== req.user.id) {
      throw new AppError('Unauthorized to view these statistics', 403);
    }

    const projectsResult = await query(
      `SELECT COUNT(*) as active_projects 
       FROM projects 
       WHERE client_id = $1 AND status != 'completed' AND status != 'cancelled'`,
      [id]
    );

    const spentResult = await query(
      `SELECT COALESCE(SUM(budget), 0) as total_spent 
       FROM projects 
       WHERE client_id = $1 AND status = 'completed'`,
      [id]
    );

    const devsResult = await query(
      `SELECT COUNT(DISTINCT developer_id) as developers_hired 
       FROM projects 
       WHERE client_id = $1 AND developer_id IS NOT NULL`,
      [id]
    );

    const ratingResult = await query(
      `SELECT COALESCE(AVG(r.rating), 0) as avg_rating 
       FROM reviews r 
       WHERE r.client_id = $1`,
      [id]
    );

    const totalProjectsResult = await query(
      'SELECT COUNT(*) as total_projects FROM projects WHERE client_id = $1',
      [id]
    );

    const completedResult = await query(
      `SELECT COUNT(*) as completed_projects 
       FROM projects 
       WHERE client_id = $1 AND status = 'completed'`,
      [id]
    );

    res.json({
      activeProjects: parseInt(projectsResult.rows[0].active_projects) || 0,
      totalSpent: parseFloat(spentResult.rows[0].total_spent).toFixed(2),
      developersHired: parseInt(devsResult.rows[0].developers_hired) || 0,
      avgRating: parseFloat(ratingResult.rows[0].avg_rating).toFixed(1),
      totalProjects: parseInt(totalProjectsResult.rows[0].total_projects) || 0,
      completedProjects: parseInt(completedResult.rows[0].completed_projects) || 0,
    });
  } catch (error) {
    next(error);
  }
};

// Get developer statistics
export const getDeveloperStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const devCheck = await query('SELECT user_id FROM developers WHERE id = $1', [id]);

    if (devCheck.rows.length === 0) {
      throw new AppError('Developer not found', 404);
    }

    if (devCheck.rows[0].user_id !== req.user.id) {
      throw new AppError('Unauthorized to view these statistics', 403);
    }

    const projectsResult = await query(
      `SELECT COUNT(*) as active_projects 
       FROM projects 
       WHERE developer_id = $1 AND status != 'completed' AND status != 'cancelled'`,
      [id]
    );

    const earningsResult = await query(
      `SELECT COALESCE(SUM(budget), 0) as total_earnings 
       FROM projects 
       WHERE developer_id = $1 AND status = 'completed'`,
      [id]
    );

    const clientsResult = await query(
      `SELECT COUNT(DISTINCT client_id) as total_clients 
       FROM projects 
       WHERE developer_id = $1`,
      [id]
    );

    const devResult = await query(
      'SELECT rating, total_reviews FROM developers WHERE id = $1',
      [id]
    );

    const totalProjectsResult = await query(
      'SELECT COUNT(*) as total_projects FROM projects WHERE developer_id = $1',
      [id]
    );

    const completedResult = await query(
      `SELECT COUNT(*) as completed_projects 
       FROM projects 
       WHERE developer_id = $1 AND status = 'completed'`,
      [id]
    );

    const statusBreakdown = await query(
      `SELECT status, COUNT(*) as count 
       FROM projects 
       WHERE developer_id = $1 
       GROUP BY status`,
      [id]
    );

    res.json({
      activeProjects: parseInt(projectsResult.rows[0].active_projects) || 0,
      totalEarnings: parseFloat(earningsResult.rows[0].total_earnings).toFixed(2),
      totalClients: parseInt(clientsResult.rows[0].total_clients) || 0,
      rating: parseFloat(devResult.rows[0]?.rating || 0).toFixed(1),
      totalReviews: parseInt(devResult.rows[0]?.total_reviews || 0),
      totalProjects: parseInt(totalProjectsResult.rows[0].total_projects) || 0,
      completedProjects: parseInt(completedResult.rows[0].completed_projects) || 0,
      projectsByStatus: statusBreakdown.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get platform statistics (admin/public)
export const getPlatformStats = async (req, res, next) => {
  try {
    const devsResult = await query('SELECT COUNT(*) as total_developers FROM developers');
    const clientsResult = await query('SELECT COUNT(*) as total_clients FROM clients');
    const projectsResult = await query('SELECT COUNT(*) as total_projects FROM projects');

    const activeProjectsResult = await query(
      `SELECT COUNT(*) as active_projects 
       FROM projects 
       WHERE status = 'in-progress'`
    );

    const reviewsResult = await query('SELECT COUNT(*) as total_reviews FROM reviews');

    const avgRatingResult = await query(
      'SELECT AVG(rating) as avg_rating FROM developers WHERE total_reviews > 0'
    );

    res.json({
      totalDevelopers: parseInt(devsResult.rows[0].total_developers) || 0,
      totalClients: parseInt(clientsResult.rows[0].total_clients) || 0,
      totalProjects: parseInt(projectsResult.rows[0].total_projects) || 0,
      activeProjects: parseInt(activeProjectsResult.rows[0].active_projects) || 0,
      totalReviews: parseInt(reviewsResult.rows[0].total_reviews) || 0,
      avgDeveloperRating: parseFloat(avgRatingResult.rows[0].avg_rating || 0).toFixed(2),
    });
  } catch (error) {
    next(error);
  }
};
