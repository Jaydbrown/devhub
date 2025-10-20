import { AppError } from "./errorHandler.js";

// ✅ Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ✅ Validate registration input
export const validateRegistration = (req, res, next) => {
  const { fullName, email, password, userType } = req.body;

  if (!fullName || fullName.trim().length < 2) {
    throw new AppError("Full name must be at least 2 characters", 400);
  }

  if (!email || !isValidEmail(email)) {
    throw new AppError("Valid email is required", 400);
  }

  if (!password || password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  if (!userType || !["Developer", "Client"].includes(userType)) {
    throw new AppError("User type must be Developer or Client", 400);
  }

  next();
};

// ✅ Validate login input
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !isValidEmail(email)) {
    throw new AppError("Valid email is required", 400);
  }

  if (!password) {
    throw new AppError("Password is required", 400);
  }

  next();
};

// ✅ Validate project creation
export const validateProject = (req, res, next) => {
  const { title, description, budget } = req.body;

  if (!title || title.trim().length < 3) {
    throw new AppError("Project title must be at least 3 characters", 400);
  }

  if (!description || description.trim().length < 10) {
    throw new AppError("Project description must be at least 10 characters", 400);
  }

  if (budget && (isNaN(budget) || budget < 0)) {
    throw new AppError("Budget must be a positive number", 400);
  }

  next();
};

// ✅ Validate review input
export const validateReview = (req, res, next) => {
  const { developerId, rating, message } = req.body;

  if (!developerId || isNaN(developerId)) {
    throw new AppError("Valid developer ID is required", 400);
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  if (!message || message.trim().length < 5) {
    throw new AppError("Review message must be at least 5 characters", 400);
  }

  next();
};

// ✅ Validate message input
export const validateMessage = (req, res, next) => {
  const { receiverId, message } = req.body;

  if (!receiverId || isNaN(receiverId)) {
    throw new AppError("Valid receiver ID is required", 400);
  }

  if (!message || message.trim().length < 1) {
    throw new AppError("Message cannot be empty", 400);
  }

  next();
};
