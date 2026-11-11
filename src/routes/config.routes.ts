import { Router } from 'express';
import {
  getCurrencies,
  getCurrencyByCountry,
  getCategories,
  getFeatureFlags,
} from '../controllers/config.controller.js';

const router = Router();

router.get('/currencies', getCurrencies);
router.get('/currency-by-country/:code', getCurrencyByCountry);
router.get('/categories', getCategories);
router.get('/features', getFeatureFlags);

export default router;

