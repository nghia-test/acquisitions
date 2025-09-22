import { signupController, signinController, signoutController } from '#@/controllers/auth.controller.js';
import express from 'express';

const router = express.Router();

router.post('/sign-up', signupController);

router.post('/sign-in', signinController);

router.post('/sign-out', signoutController);

export default router;
