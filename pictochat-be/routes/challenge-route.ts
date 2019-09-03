import express from 'express';
import { ChallengeService } from '../services/challenge-service';

export const challengeRouter = express.Router();

/* GET test. */
challengeRouter.get('/test', function(req, res, next) {
  res.status(200).json('respond with a resource');
});

// POST sales
challengeRouter.post('/', async function(req, res, next) {
  try {
    const { sales } = req.body;
    const rate = await ChallengeService.getChallengeRate();
    const commission = Number(sales) * rate;
    res.json({ commission });
  } catch (error) {
    next(error);
  }
});
