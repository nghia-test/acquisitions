import jwt from 'jsonwebtoken';
import logger from '#@/config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

const JWT_EXPIRES_IN = '1d';

export const jwtToken = {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (error) {
      logger.error('Fail to authenticate user', error);
      throw new Error('Fail to authenticate user');
    }
  },
  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error('Fail to authenticate user', error);
      throw new Error('Fail to authenticate user');
    }
  },
};
