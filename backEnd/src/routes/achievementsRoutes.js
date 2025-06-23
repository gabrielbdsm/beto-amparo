// backend/routes/achievementsRoutes.js
import express from 'express';
import { getOwnerAchievements } from '../controllers/Empresa/AchievementController.js';
import { routePrivate } from '../middleware/protectRoutes.js'; // Ou seu middleware de empresa

const router = express.Router();

router.get('/empresa/:slugLoja/achievements', routePrivate, getOwnerAchievements);

export default router;