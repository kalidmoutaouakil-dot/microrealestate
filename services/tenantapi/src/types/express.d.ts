import { Realm } from '@microrealestate/types';

declare global {
  namespace Express {
    interface Request {
      realm?: Realm;
      user?: any;
    }
  }
}

export {};
