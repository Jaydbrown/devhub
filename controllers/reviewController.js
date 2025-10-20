import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all reviews for a developer
export const getDeveloperReviews = async (req, res, next) => {
  try {
    const { developerId } = req.params;

    const result = await query(
      `SELECT r.*, u.full_name as client_name 
       FROM reviews r 
       JOIN users u ON r.client_id = u.id 
       WHERE r.developer_id = $1 
       ORDER BY r.created_at DESC`,
      [developerId]
    );

    res.json({
      reviews: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

// Add review for developer
export const addReview = async (req, res, next) => {
  try {
    const { developerId, rating, message } = req.body;
    const clientId = req.user.id;

    if (req.user.userType !== 'Client') {
      throw new AppError('Only clients can leave reviews', 403);
    }

    const devCheck = await query('SELECT id FROM developers WHERE id = $1', [developerId]);
    if (devCheck.rows.length === 0) {
      throw new AppError('Developer not found', 404);
    }

    const existingReview = await query(
      'SELECT id FROM reviews WHERE developer_id = $1 AND client_id = $2',
      [developerId, clientId]
    );

    if (existingReview.rows.length > 0) {
      throw new AppError('You have already reviewed this developer', 400);
    }

    const reviewResult = await query(
      `INSERT INTO reviews (developer_id, client_id, rating, message, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [developerId, clientId, rating, message]
    );

    const avgResult = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE developer_id = $1',
      [developerId]
    );

    await query(
      'UPDATE developers SET rating = $1, total_reviews = $2 WHERE id = $3',
      [
        parseFloat(avgResult.rows[0].avg_rating).toFixed(2),
        avgResult.rows[0].total,
        developerId,
      ]
    );

    res.status(201).json({
      message: 'Review added successfully',
      review: reviewResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update review
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, message } = req.body;

    const reviewCheck = await query('SELECT client_id, developer_id FROM reviews WHERE id = $1', [id]);
    
    if (reviewCheck.rows.length === 0) {
      throw new AppError('Review not found', 404);
    }

    if (reviewCheck.rows[0].client_id !== req.user.id) {
      throw new AppError('Unauthorized to update this review', 403);
    }

    const result = await query(
      `UPDATE reviews 
       SET rating = COALESCE($1, rating),
           message = COALESCE($2, message)
       WHERE id = $3 
       RETURNING *`,
      [rating, message, id]
    );

    const developerId = reviewCheck.rows[0].developer_id;
    const avgResult = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE developer_id = $1',
      [developerId]
    );

    await query(
      'UPDATE developers SET rating = $1, total_reviews = $2 WHERE id = $3',
      [
        parseFloat(avgResult.rows[0].avg_rating).toFixed(2),
        avgResult.rows[0].total,
        developerId,
      ]
    );

    res.json({
      message: 'Review updated successfully',
      review: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete review
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reviewCheck = await query('SELECT client_id, developer_id FROM reviews WHERE id = $1', [id]);
    
    if (reviewCheck.rows.length === 0) {
      throw new AppError('Review not found', 404);
    }

    if (reviewCheck.rows[0].client_id !== req.user.id) {
      throw new AppError('Unauthorized to delete this review', 403);
    }

    const developerId = reviewCheck.rows[0].developer_id;

    await query('DELETE FROM reviews WHERE id = $1', [id]);

    const avgResult = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE developer_id = $1',
      [developerId]
    );

    const newRating = avgResult.rows[0].total > 0 
      ? parseFloat(avgResult.rows[0].avg_rating).toFixed(2) 
      : 0;

    await query(
      'UPDATE developers SET rating = $1, total_reviews = $2 WHERE id = $3',
      [newRating, avgResult.rows[0].total, developerId]
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
