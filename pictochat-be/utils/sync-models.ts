import { DiscussionPost } from '../models/discussion-post';
import { DiscussionThread } from '../models/discussion-thread';

export async function syncModels() {
  try {
    await DiscussionThread.sync({ force: true });
    await DiscussionPost.sync({ force: true });
  } catch (error) {
    console.log('Error:', error);
  };
}
