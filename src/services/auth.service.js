import logger from '#@/config/logger.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '#@/config/database.js';
import { users } from '#@/models/user.model.js';

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error('Hash password error', error);
    throw new Error('Hash password error');
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Compare password error', error);
    throw new Error('Compare password error');
  }
};

export const createUser = async ({ name, email, password, role }) => {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    logger.info(`User created successfully: ${user.email}`);

    return user;
  } catch (error) {
    logger.error('Create user error', error);
    throw error;
  }
};

export const authenticateUser = async ({ email, password }) => {
  try {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        password: users.password,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (rows.length === 0) {
      // Avoid revealing whether the email exists
      throw new Error('Invalid email or password');
    }

    const found = rows[0];
    const isMatch = await comparePassword(password, found.password);

    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const user = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
    };
    logger.info(`User authenticated successfully: ${user.email}`);
    return user;
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      // Expected auth failure, still log for audit without stack noise
      logger.warn('Authentication failed');
      throw error;
    }
    logger.error('Authenticate user error', error);
    throw error;
  }
};

