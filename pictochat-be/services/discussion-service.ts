import uuid from 'uuid/v4';
import { DiscussionPost } from '../models/discussion-post';
import { DiscussionThread } from '../models/discussion-thread';
import { DiscussionTreeNode } from '../models/discussion-tree-node';
import { NewImage, ImageService } from '../services/image-service';
import { Image } from '../models/image';
import { NotFoundError } from '../exceptions/not-found-error';
import { ForbiddenError } from '../exceptions/forbidden-error';
import { UnprocessableError } from '../exceptions/unprocessable-error';
import { isNullOrUndefined } from 'util';
import { SortValue } from '../utils/sort-types';
import { PaginationOptions } from '../utils/pagination-types';
import { PaginationService, PaginatedResults } from './pagination-service';
import { UserService } from './user-service';
import { DiscussionThreadRepo } from '../repositories/discussion-thread-repo';
import { DiscussionPostRepo } from '../repositories/discussion-post-repo';
import { transaction } from '../utils/transaction';

// HELPER INTERFACES

export enum ArchiveType {
  DELETED,
  HIDDEN
}

// SERVICE

export class DiscussionService {
  /**
   * Get specified post. Throws an error if not found.
   * @param postId
   */
  static async getPost(postId: number): Promise<DiscussionPost> {
    const post = await DiscussionPostRepo.getDiscussionPost(postId);
    if (post === null) {
      throw new NotFoundError(`Post with postId: ${postId} does not exist`);
    }
    return post;
  }

  /**
   * Creates and persists a new thread
   * @param userId post's author
   * @param newImage post's content
   * @returns DiscussionThread instance created with the specified newThread data */
  static async createThread(userId: number, newImage: NewImage): Promise<DiscussionThread> {
    return await transaction(async () => {
      const image: Image = await ImageService.saveImage(newImage);
      const discussionId: string = uuid();
      const rootPost: DiscussionPost = await DiscussionPost.create({
        isRootPost: true,
        imageId: image.imageId,
        authorId: userId,
        postedDate: new Date(),
        discussionId: discussionId
      });
      return new DiscussionThread(discussionId, rootPost, 0);
    });
  }

  /**
   * Creates and persists a new reply to an existing post
   * @param userId authors userId
   * @param parentPostId post being replied to
   * @param newImage post's content
   */
  static async createReply(userId: number, parentPostId: number, newImage: NewImage): Promise<DiscussionPost> {
    return await transaction(async () => {
      const image: Image = await ImageService.saveImage(newImage);
      const parentPost: DiscussionPost = await DiscussionPost.findOne({ where: { postId: parentPostId } });

      const parentReplyPath: string = parentPost.replyTreePath || '';
      const reply: DiscussionPost = await DiscussionPost.create({
        discussionId: parentPost.discussionId,
        imageId: image.imageId,
        authorId: userId,
        postedDate: new Date(),
        parentPostId: parentPost.postId,
        replyTreePath: `${parentReplyPath}${parentPost.postId}/`
      });

      return reply;
    });
  }

  /**
   * Change a post's image
   *
   * @param userId user trying to update the psot
   * @param postId
   * @param newImage new content for post
   */
  static async updatePost(userId: number, postId: number, newImage: NewImage): Promise<DiscussionPost> {
    return await transaction(async () => {
      let post: DiscussionPost = await DiscussionService.getPost(postId);

      // Can't update another user's post
      if (post.authorId !== userId) throw new ForbiddenError();
      if (!(await post.isUpdatable())) {
        throw new UnprocessableError('A post cannot be editted if it has been replied too or has active reactions');
      }

      let image: Image = await ImageService.saveImage(newImage);

      post.imageId = image.imageId;
      post.save();

      return post;
    });
  }

  /**
   * Marks a post as deleted or hidden
   * @param postId
   * @param requestingUserId userId for user who is trying to achive the post
   */
  static async archivePost(postId: number, requestingUserId: number): Promise<ArchiveType> {
    return await transaction(async () => {
      const post = await DiscussionService.getPost(postId);

      // Posts can only be deleted by their author OR an admin user
      if (post.authorId !== requestingUserId) {
        const requestingUser = await UserService.getUser(requestingUserId);
        if (!requestingUser.hasAdminRole) {
          throw new ForbiddenError();
        }
      }

      let archiveType: ArchiveType;
      if (await post.isDeleteable()) {
        post.setDeleted();
        archiveType = ArchiveType.DELETED;
      } else {
        post.hide();
        archiveType = ArchiveType.HIDDEN;
      }

      await post.save();

      return archiveType;
    });
  }

  /**
   * Set or unset a posts inappropriate content flag
   * @param postId
   * @param flagValue
   */
  static async setInappropriateFlag(postId: number, flagValue: boolean): Promise<DiscussionPost> {
    return await transaction(async () => {
      const post = await DiscussionService.getPost(postId);
      post.setInappropriateFlag(flagValue);
      await post.save();
      return post;
    });
  }

  /** Creates a list of summaries for each thread containing the rootPost
   *  and agggregate metrics (e.g. comment count). */
  static async getPaginatedSummaries(
    sortType: SortValue = '',
    paginationOptions: PaginationOptions
  ): Promise<PaginatedResults<DiscussionThread>> {
    let discussionThreads = await DiscussionThreadRepo.getDiscussionThreads(sortType);
    let paginatedSummaries = PaginationService.getPaginatedResults(discussionThreads, paginationOptions);
    return paginatedSummaries;
  }

  /**
   * Get a tree like representation of postId and its replies (with postId as the root node)
   * @param postId
   * @param sortType The sorting strategy to use amonsts direct replies to the same post
   * @param paginationOptions
   */
  static async getReplyTreeUnderPost(
    postId: number,
    sortType?: SortValue,
    paginationOptions?: PaginationOptions
  ): Promise<DiscussionTreeNode> {
    let posts = await DiscussionService.getPostReplies(
      postId,
      sortType,
      paginationOptions ? paginationOptions.start : null
    );
    return await DiscussionService.makeReplyTree(posts, paginationOptions ? paginationOptions.limit : null);
  }

  /**
   * Get replies for the specified post
   * @param postId
   * @param sortType The sorting strategy to use
   * @param startAfterPostId The lowest postId to include (for pagination)
   */
  static async getPostReplies(
    postId: number,
    sortType?: SortValue,
    startAfterPostId?: number
  ): Promise<DiscussionPost[]> {
    const rootPost = await DiscussionPostRepo.getDiscussionPost(postId);
    let posts: DiscussionPost[] = await DiscussionPostRepo.getPathOrderedSubTreeUnder(rootPost, sortType);
    if (!isNullOrUndefined(startAfterPostId)) posts = PaginationService.getFilteredReplies(posts, startAfterPostId);
    posts.unshift(rootPost);
    return posts;
  }

  /**
   * @param posts Array of posts ordered by replyTreePath such that the root is the first post
   * @param limit If specified only the first `limit` replies in posts will be included
   * @returns Nested tree-like representation of the specified posts array */
  private static async makeReplyTree(posts: DiscussionPost[], limit?: number): Promise<DiscussionTreeNode> {
    // Create reply tree
    let nodes: { [postId: number]: DiscussionTreeNode } = {};
    let rootPostId: number = posts[0].postId;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const isUnderLimit = isNullOrUndefined(limit) ? true : i < limit;
      let treeNode = await DiscussionTreeNode.makeInstance(post);
      if (isUnderLimit) nodes[treeNode.postId] = treeNode;

      const parentPostId: number = treeNode.parentPostId;
      if (parentPostId !== null) {
        const parentNode = nodes[parentPostId];
        if (!!parentNode) {
          if (isUnderLimit) {
            parentNode.addReply(treeNode);
          } else {
            parentNode.hasMore = true;
          }
        }
      }
    }

    return nodes[rootPostId];
  }

  /**
   * Create an array of flat JSON objects for the specified discussions threads
   */
  static flattenDiscussions(discussions: DiscussionThread[]): DiscussionThread[] {
    return discussions.map(discussion => discussion.toFlatJSON());
  }
}
