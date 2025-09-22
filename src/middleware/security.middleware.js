import aj from '#@/config/arcjet.js';
import logger from '#@/config/logger.js';
import { slidingWindow } from '@arcjet/node';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;
    switch (role) {
      case 'guest':
        limit = 5;
        break;
      case 'user':
        limit = 10;
        break;
      case 'admin':
        limit = 20;
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}_limit`,
        // message,
      })
    );

    const decision = await client.protect(req);
    console.log({ decision });
    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot detected: ', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Bot detected',
      });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield blocked request: ', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Shield detected',
      });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded: ', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Rate limit exceeded',
      });
    }

    next();
  } catch (error) {
    console.error('Arcjet middleware error: ', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong with security middleware',
    });
  }
};

export default securityMiddleware;
