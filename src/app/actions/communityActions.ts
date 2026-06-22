'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const postSchema = z.object({
  title: z.string().min(5).max(150),
  content: z.string().min(10).max(5000),
  category: z.enum(['question', 'reflection', 'support', 'general']),
});

const commentSchema = z.object({
  postId: z.string(),
  content: z.string().min(2).max(2000),
});

export async function getPosts(page = 1, limit = 20, category?: string) {
  try {
    await connectToDatabase();
    
    const query: Record<string, any> = category && category !== 'all' ? { category } : {};
    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .populate('userId', 'name')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments(query);

    return { 
      success: true, 
      posts: JSON.parse(JSON.stringify(posts)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  } catch (error: any) {
    console.error('Failed to get posts:', error);
    return { success: false, error: error.message };
  }
}

export async function getPostWithComments(postId: string) {
  try {
    await connectToDatabase();
    
    const post = await Post.findById(postId).populate('userId', 'name').lean();
    if (!post) throw new Error('Post not found');

    const comments = await Comment.find({ postId })
      .populate('userId', 'name')
      .sort({ createdAt: 1 })
      .lean();

    return { 
      success: true, 
      post: JSON.parse(JSON.stringify(post)),
      comments: JSON.parse(JSON.stringify(comments))
    };
  } catch (error: any) {
    console.error('Failed to get post:', error);
    return { success: false, error: error.message };
  }
}

export async function createPost(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;

    const parseResult = postSchema.safeParse({ title, content, category });
    if (!parseResult.success) throw new Error(`Validation Error: ${parseResult.error.message}`);

    const post = await Post.create({
      userId: user._id,
      title: parseResult.data.title,
      content: parseResult.data.content,
      category: parseResult.data.category,
    });

    revalidatePath('/community');
    return { success: true, postId: post._id.toString() };
  } catch (error: any) {
    console.error('Failed to create post:', error);
    return { success: false, error: error.message };
  }
}

export async function createComment(postId: string, content: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error('Unauthorized');

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) throw new Error('User not found');

    const parseResult = commentSchema.safeParse({ postId, content });
    if (!parseResult.success) throw new Error(`Validation Error: ${parseResult.error.message}`);

    await Comment.create({
      userId: user._id,
      postId: parseResult.data.postId,
      content: parseResult.data.content,
    });

    // Increment comment count on post
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    revalidatePath(`/community`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create comment:', error);
    return { success: false, error: error.message };
  }
}
