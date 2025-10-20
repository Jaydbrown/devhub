// controllers/pageController.js
import pool from "../config/db.js";

export async function homePage(req, res) {
  try {
    const categories = (await pool.query(`SELECT name FROM categories ORDER BY name`)).rows;
    const testimonials = (await pool.query(`SELECT quote, author FROM testimonials ORDER BY id DESC LIMIT 5`)).rows;
    res.render("index", { categories, testimonials, user: req.session?.user || null });
  } catch (err) {
    console.error("homePage error:", err);
    res.status(500).send("Server error");
  }
}

export async function developersPage(req, res) {
  // For simplicity server-render first 50 developers
  try {
    const devs = (await pool.query(`
      SELECT d.id as developer_id, u.full_name, u.username, d.avatar_url, d.skills, s.average_rating
      FROM developers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN developer_stats s ON s.developer_id = d.id
      ORDER BY s.average_rating DESC NULLS LAST
      LIMIT 100
    `)).rows;
    res.render("developers", { developers: devs, user: req.session?.user || null });
  } catch (err) {
    console.error("developersPage error:", err);
    res.status(500).send("Server error");
  }
}

export async function profilePage(req, res) {
  try {
    const id = req.params.id;
    const data = await pool.query(`
      SELECT d.*, u.full_name, u.username, s.active_projects, s.total_earnings, s.average_rating, s.clients_worked
      FROM developers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN developer_stats s ON s.developer_id = d.id
      WHERE d.id=$1
    `, [id]);
    if (data.rows.length === 0) return res.status(404).send("Developer not found");
    const dev = data.rows[0];
    const projects = (await pool.query(`SELECT id, title, status, budget FROM projects WHERE developer_id=$1 ORDER BY updated_at DESC LIMIT 10`, [id])).rows;
    const reviews = (await pool.query(`SELECT author, rating, message, created_at FROM reviews WHERE developer_id=$1 ORDER BY created_at DESC LIMIT 20`, [id])).rows;
    const comments = (await pool.query(`SELECT author, text, created_at FROM comments WHERE developer_id=$1 ORDER BY created_at DESC LIMIT 50`, [id])).rows;
    res.render("profile", { developer: dev, projects, reviews, comments, user: req.session?.user || null });
  } catch (err) {
    console.error("profilePage error:", err);
    res.status(500).send("Server error");
  }
}

export async function dashboardPage(req, res) {
  try {
    // ensure logged in and is developer
    const user = req.session?.user;
    if (!user) return res.redirect("/"); // or show login
    // find developer id by user id
    const devRow = await pool.query(`SELECT id FROM developers WHERE user_id=$1`, [user.id]);
    if (devRow.rows.length === 0) return res.status(403).send("Not a developer");
    const devId = devRow.rows[0].id;
    // fetch data
    const developer = (await pool.query(`
      SELECT d.*, u.full_name, u.username, s.active_projects, s.total_earnings, s.average_rating, s.clients_worked
      FROM developers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN developer_stats s ON s.developer_id = d.id
      WHERE d.id = $1
    `, [devId])).rows[0];

    const projects = (await pool.query(`SELECT id, title, status, budget, updated_at FROM projects WHERE developer_id = $1 ORDER BY updated_at DESC LIMIT 50`, [devId])).rows;
    const messages = (await pool.query(`SELECT sender_name, content, sent_at FROM messages WHERE developer_id = $1 ORDER BY sent_at DESC LIMIT 20`, [devId])).rows;

    res.render("dashboard", { developer, projects, messages, user });
  } catch (err) {
    console.error("dashboardPage error:", err);
    res.status(500).send("Server error");
  }
}
