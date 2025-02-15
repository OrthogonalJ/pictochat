import { IDiscussionPost } from '../models/store/DiscussionPost';
import ApiService from './ApiService';
import NewPostPayload from '../models/NewPostPayload';
import ValidationException from '../models/exceptions/ValidationException';
import PaginationResult from '../models/PaginationResult';
import { SortValue, SortTypes } from '../models/SortTypes';

/**
 * Implements HTTP Requests for the `'/discussion'` API endpoint
 * @class
 * @static
 */
export class DiscussionService {
  static async getDiscussions(sort: SortValue, limit = 10, start?: number): Promise<PaginationResult<IDiscussionPost>> {
    return await ApiService.get('/discussion', { sort, limit, start });
  }

  // 'after' is the id of the post before the new replies that you want
  static async getPost(postId: string, sort: SortValue, limit = 10, after?: string): Promise<IDiscussionPost> {
    return await ApiService.get(`/post/${postId}`, { limit, after, sort });
  }

  static async getPostReplies(discussionId: string, sort: SortValue): Promise<IDiscussionPost[]> {
    const discussion = await this.getPost(discussionId, sort);
    return discussion.replies;
  }

  static async createPost(post: NewPostPayload): Promise<IDiscussionPost> {
    const isReplyPost: boolean = !!post.parentPostId;
    // IMPORTANT: Image must be the last field appended to form data or the server will not see the other fields
    const formData = new FormData();
    formData.append('userId', post.userId);
    if (isReplyPost) {
      formData.append('parentPostId', post.parentPostId);
    }
    formData.append('image', post.image);

    let response = await ApiService.post('/post', formData, null);
    // TODO: Have backend return API URL path that can be used retireve newly created post resource
    return await DiscussionService.getPost(response.postId || response.rootPostId, SortTypes.NEW);
  }

  static async updatePost(data: { postId: number; image: File }): Promise<IDiscussionPost> {
    try {
      const formData = new FormData();
      // IMPORTANT: Image must be the last field appended to form data or the server will not see the other fields
      formData.append('postId', data.postId.toString());
      formData.append('image', data.image);
      const updatedPost: IDiscussionPost = await ApiService.patch(`/post/${data.postId}`, formData, null);
      return updatedPost;
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException();
      }
    }
  }

  static async deletePost(postId: number | string): Promise<IDiscussionPost> {
    return await ApiService.sendDelete(`/post/${postId}`);
  }
}

export default DiscussionService;
