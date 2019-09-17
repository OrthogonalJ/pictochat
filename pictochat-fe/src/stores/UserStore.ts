import { observable, computed, action, ObservableMap, runInAction } from 'mobx';
import { UserModel, User } from '../models/User';
import UserService from '../services/UserService';

/**
 * Co-ordinates updates to the logged in user's data
 */
export default class UserStore {
  // @observable users: ObservableMap<any, UserModel> = observable.map(undefined, { name: "users" });
  @observable currentUser: UserModel = new UserModel();
  @observable isLoading: boolean = true;

  @action.bound
  async createUser(userJson: User): Promise<UserModel> {
    this.isLoading = true;
    let { user } = await UserService.addUser(userJson);
    let realUser: UserModel;
    runInAction(() => {
      realUser = new UserModel(user);
      // this.users.set(user.username, user);
      this.isLoading = false;
    });
    return realUser;
  }

  @action.bound
  setCurrentUser(user: UserModel) {
    this.currentUser.replace(new UserModel(user));
  }

  // @action.bound
  // async authAndSetCurrentUser(credentials: { username: string, password: string }): Promise<UserModel> { }
}
