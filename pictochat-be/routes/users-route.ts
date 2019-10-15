import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import config from '../utils/config';
import { UserService } from '../services/user-service';
import { strategies } from '../middleware/passport-middleware';
import { deviceIdMiddleware } from '../middleware/device-id-middleware';
import { User } from '../models/user';
import { registerUserMiddleware } from '../middleware/register-user-middleware';
import { LoginLogRepo } from '../repositories/login-log-repo';

//// HELPERS ////

function makeJWTPayload(user: User): { auth: boolean; token: string } {
  const token = jwt.sign({ id: user.userId }, config.JWT_SECRET, {
    expiresIn: '24h'
  });
  return { auth: true, token };
}

//// ROUTER ////

export const userRouter = express.Router();

// get user by username
userRouter.get('/:username', async (req, res, next) => {
  try {
    const user: User = await UserService.getUserByUsername(req.params.username);
    res.json(user.getPublicJSON());
  } catch (error) {
    next(error);
  }
});

// GET /user
userRouter.get('/', async (req, res, next) => {
  try {
    let users: User[] = await UserService.getUsers();
    res.json(users.map(user => user.getPublicJSON()));
    // if (req.query.username) {
    //   // get user by username
    //   const user = await UserService.getUserByUsername(req.query.username);
    //   return res.json(user.toJSON());
    // } else {
    //   // get all users
    //   let users = await UserService.getUsers();
    //   return res.json(users.map(user => user.getPublicJSON()));
    // }
  } catch (error) {
    next(error);
  }
});

// GET current user ONLY IF AUTHED
userRouter.get('/authed', passport.authenticate(strategies.JWT, { session: false }), (req: any, res, next) => {
  try {
    res.json((req.user as User).getPublicJSON());
  } catch (error) {
    next(error);
  }
});

// POST create user
userRouter.post('/', registerUserMiddleware, deviceIdMiddleware, async (req: any, res, next) => {
  passport.authenticate(strategies.REGISTER, (err, user: boolean | User, info) => {
    if (err) return next(err);
    if (!user && !!info) {
      return res.status(400).json(info);
    }
    if (!!info) return res.json(info);

    try {
      req.logIn(user, async err => {
        let typedUser = user as User;
        await UserService.updateUser(typedUser.userId, { email: req.body.email });
        let body = makeJWTPayload(typedUser);
        body['message'] = 'User created successfully';
        body['user'] = typedUser.getPublicJSON();
        res.json(body);

        LoginLogRepo.logUserAccess(typedUser, req.deviceId);
      });
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

// POST auth user
userRouter.post('/login', deviceIdMiddleware, (req: any, res, next) => {
  passport.authenticate(strategies.LOGIN, (err, user, info) => {
    if (err) return next(err);
    if (!!info) return res.json(info);
    try {
      req.logIn(user, async err => {
        let body = makeJWTPayload(user as User);
        body['message'] = 'User logged in successfully';
        res.json(body);

        LoginLogRepo.logUserAccess(user, req.deviceId);
      });
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

userRouter.delete(
  '/:userId',
  passport.authenticate(strategies.JWT, { session: false }),
  async (req: any, res, next) => {
    try {
      await UserService.disableUser(req.params.userId, req.user.userId);
      res.status(204);
      res.end();
    } catch (error) {
      next(error);
    }
  }
);
