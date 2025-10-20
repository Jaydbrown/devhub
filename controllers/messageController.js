import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all messages for current user
export const getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationWith, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT m.*, 
             sender.full_name AS sender_name,
             sender.email AS sender_email,
             receiver.full_name AS receiver_name,
             receiver.email AS receiver_email
      FROM messages m 
      JOIN users sender ON m.sender_id = sender.id 
      JOIN users receiver ON m.receiver_id = receiver.id 
      WHERE (m.sender_id = $1 OR m.receiver_id = $1)
    `;
    const params = [userId];
    let paramCount = 2;

    if (conversationWith) {
      queryText += ` AND (m.sender_id = $${paramCount} OR m.receiver_id = $${paramCount})`;
      params.push(conversationWith);
      paramCount++;
    }

    queryText += ` ORDER BY m.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      messages: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get conversations (unique users user has messaged with)
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT DISTINCT ON (other_user_id) 
              other_user_id,
              other_user_name,
              other_user_email,
              last_message,
              last_message_time,
              unread_count
       FROM (
         SELECT 
           CASE 
             WHEN m.sender_id = $1 THEN m.receiver_id 
             ELSE m.sender_id 
           END AS other_user_id,
           CASE 
             WHEN m.sender_id = $1 THEN receiver.full_name 
             ELSE sender.full_name 
           END AS other_user_name,
           CASE 
             WHEN m.sender_id = $1 THEN receiver.email 
             ELSE sender.email 
           END AS other_user_email,
           m.message AS last_message,
           m.created_at AS last_message_time,
           (SELECT COUNT(*) FROM messages 
            WHERE receiver_id = $1 
            AND sender_id = CASE 
              WHEN m.sender_id = $1 THEN m.receiver_id 
              ELSE m.sender_id 
            END
            AND is_read = false) AS unread_count
         FROM messages m
         JOIN users sender ON m.sender_id = sender.id
         JOIN users receiver ON m.receiver_id = receiver.id
         WHERE m.sender_id = $1 OR m.receiver_id = $1
         ORDER BY m.created_at DESC
       ) conversations
       ORDER BY other_user_id, last_message_time DESC`,
      [userId]
    );

    res.json({
      conversations: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};

// Send message
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    // Check if receiver exists
    const receiverCheck = await query('SELECT id FROM users WHERE id = $1', [receiverId]);
    if (receiverCheck.rows.length === 0) {
      throw new AppError('Receiver not found', 404);
    }

    // Can't send message to self
    if (senderId === parseInt(receiverId)) {
      throw new AppError('Cannot send message to yourself', 400);
    }

    const result = await query(
      `INSERT INTO messages (sender_id, receiver_id, message, is_read, created_at) 
       VALUES ($1, $2, $3, false, NOW()) 
       RETURNING *`,
      [senderId, receiverId, message]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Mark message as read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is receiver
    const messageCheck = await query('SELECT receiver_id FROM messages WHERE id = $1', [id]);
    
    if (messageCheck.rows.length === 0) {
      throw new AppError('Message not found', 404);
    }

    if (messageCheck.rows[0].receiver_id !== userId) {
      throw new AppError('Unauthorized to mark this message as read', 403);
    }

    await query('UPDATE messages SET is_read = true WHERE id = $1', [id]);

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};

// Mark all messages from a user as read
export const markAllAsRead = async (req, res, next) => {
  try {
    const { senderId } = req.params;
    const userId = req.user.id;

    const result = await query(
      'UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false',
      [userId, senderId]
    );

    res.json({
      message: 'All messages marked as read',
      count: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
};

// Delete message
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership (sender can delete)
    const messageCheck = await query('SELECT sender_id FROM messages WHERE id = $1', [id]);
    
    if (messageCheck.rows.length === 0) {
      throw new AppError('Message not found', 404);
    }

    if (messageCheck.rows[0].sender_id !== userId) {
      throw new AppError('Unauthorized to delete this message', 403);
    }

    await query('DELETE FROM messages WHERE id = $1', [id]);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};
