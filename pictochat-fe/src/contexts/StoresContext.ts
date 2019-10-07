import * as React from 'react';
import DiscussionStore from '../stores/DiscussionStore';
import UserStore from '../stores/UserStore';
import { LeaderboardStore } from '../stores/LeaderboardStore';
import { SockPuppetAlertStore } from '../stores/SockPuppetAlertStore';

export interface IStoresContext {
  discussion: DiscussionStore;
  user: UserStore;
  leaderboard: LeaderboardStore;
  sockPuppetAlerts: SockPuppetAlertStore;
}

// HELPER FUNCTIONS

export function initStores(): IStoresContext {
  const userStore = new UserStore();
  return {
    discussion: new DiscussionStore(),
    user: userStore,
    leaderboard: new LeaderboardStore(),
    sockPuppetAlerts: new SockPuppetAlertStore(userStore)
  };
}

// CONTEXT
export const StoresContext = React.createContext<IStoresContext>(undefined);
export default StoresContext;
