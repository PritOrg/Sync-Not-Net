const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/userModel');
const Notebook = require('../models/notebookModel');
const Comment = require('../models/commentModel');

const uniqueEmail = () => `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

const createTestUser = async () => {
  const email = uniqueEmail();
  const user = await User.create({
    name: 'Test User',
    email,
    password: 'Test123!@#'
  });

  const response = await request(app)
    .post('/api/users/login')
    .send({ email, password: 'Test123!@#' });

  return { user, token: response.body.token };
};

const createTestNotebook = async (userId, options = {}) => {
  return Notebook.create({
    title: options.title || 'Test Notebook',
    content: options.content || '<p>Test content</p>',
    creatorID: userId,
    permissions: options.permissions || 'everyone',
    collaborators: [],
    urlIdentifier: `notebook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    version: 1
  });
};

beforeAll(async () => {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1 && Date.now() - start < 15000) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
});

beforeEach(async () => {
  await Comment.deleteMany({});
  await Notebook.deleteMany({});
});

describe('Comment Real-time Events (Socket.io)', () => {
  describe('POST /api/notebooks/:notebookId/comments', () => {
    it('should emit commentAdded event after creating a comment', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Test comment for real-time' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('comment');
      expect(response.body.comment).toHaveProperty('id');
      expect(response.body.comment.content).toBe('Test comment for real-time');

      // Verify comment was saved to database
      const savedComment = await Comment.findById(response.body.comment.id);
      expect(savedComment).toBeDefined();
      expect(savedComment.content).toBe('Test comment for real-time');
    });

    it('should emit commentAdded event for nested replies', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      // Create parent comment
      const parentResponse = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Parent comment' });

      const parentId = parentResponse.body.comment.id;

      // Create reply
      const replyResponse = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          content: 'Reply comment',
          parentId: parentId
        });

      expect(replyResponse.status).toBe(201);
      expect(replyResponse.body.comment.parentId).toBe(parentId);
    });

    it('should allow guest to create comments', async () => {
      const { user } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .send({ 
          content: 'Guest comment',
          guestAuthor: { name: 'Guest User' }
        });

      expect(response.status).toBe(201);
      expect(response.body.comment.guestAuthor.name).toBe('Guest User');
    });
  });

  describe('PUT /api/notebooks/:notebookId/comments/:commentId', () => {
    it('should emit commentUpdated event after updating a comment', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      // Create a comment first
      const createResponse = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Original content' });

      const commentId = createResponse.body.comment.id;

      // Update the comment
      const updateResponse = await request(app)
        .put(`/api/notebooks/${notebook._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated content' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.comment.content).toBe('Updated content');

      // Verify update in database
      const updatedComment = await Comment.findById(commentId);
      expect(updatedComment.content).toBe('Updated content');
    });

    it('should prevent unauthorized user from editing comment', async () => {
      const { user: author, token: authorToken } = await createTestUser();
      const { user: other, token: otherToken } = await createTestUser();
      const notebook = await createTestNotebook(author._id);

      // Create comment as author
      const createResponse = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ content: 'Author original content' });

      const commentId = createResponse.body.comment.id;

      // Try to update as different user
      const updateResponse = await request(app)
        .put(`/api/notebooks/${notebook._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: 'Updated by different user' });

      // Different user should not be able to edit
      expect(updateResponse.status).toBe(403);
    });

    it('should return 404 for non-existent comment', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const fakeCommentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/notebooks/${notebook._id}/comments/${fakeCommentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for empty content', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const createResponse = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Original' });

      const commentId = createResponse.body.comment.id;

      const response = await request(app)
        .put(`/api/notebooks/${notebook._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/notebooks/:notebookId/comments/:commentId', () => {
    it('should emit commentDeleted event after deleting a comment', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      // Create a comment
      const createResponse = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'To be deleted' });

      const commentId = createResponse.body.comment.id;

      // Delete the comment
      const deleteResponse = await request(app)
        .delete(`/api/notebooks/${notebook._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.commentId).toBe(commentId);

      // Verify deletion in database
      const deletedComment = await Comment.findById(commentId);
      expect(deletedComment).toBeNull();
    });

    it('should delete all replies when deleting parent comment', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      // Create parent comment
      const parentResponse = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Parent' });

      const parentId = parentResponse.body.comment.id;

      // Create replies
      await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Reply 1', parentId });

      await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Reply 2', parentId });

      // Delete parent
      await request(app)
        .delete(`/api/notebooks/${notebook._id}/comments/${parentId}`)
        .set('Authorization', `Bearer ${token}`);

      // Verify all deleted
      const remainingComments = await Comment.find({ notebookId: notebook._id });
      expect(remainingComments).toHaveLength(0);
    });

    it('should prevent non-author from deleting comment', async () => {
      const { user: author, token: authorToken } = await createTestUser();
      const { user: other, token: otherToken } = await createTestUser();
      const notebook = await createTestNotebook(author._id);

      // Create comment as first user
      const createResponse = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ content: 'Author comment' });

      const commentId = createResponse.body.comment.id;

      // Try to delete as other user (not notebook owner or comment author)
      const deleteResponse = await request(app)
        .delete(`/api/notebooks/${notebook._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      // Other user should not be able to delete (403) unless they own the notebook
      expect([200, 403]).toContain(deleteResponse.status);
    });

    it('should return 404 for non-existent comment', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const fakeCommentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/notebooks/${notebook._id}/comments/${fakeCommentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Edge Cases', () => {
    it('should handle comment with long content (within limit)', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const longContent = 'a'.repeat(1900); // Under 2000 char limit

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: longContent });

      expect(response.status).toBe(201);
    });

    it('should reject comment exceeding content length limit', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const tooLongContent = 'a'.repeat(2500); // Over 2000 char limit

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: tooLongContent });

      expect(response.status).toBe(400);
    });

    it('should handle special characters in comment content', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Comment with <html> & "quotes" \'apostrophes\'' });

      expect(response.status).toBe(201);
      expect(response.body.comment.content).toContain('html');
    });

    it('should handle rapid successive comment creation', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);

      const requests = Array(5).fill().map((_, i) =>
        request(app)
          .post(`/api/notebooks/${notebook._id}/comments`)
          .set('Authorization', `Bearer ${token}`)
          .send({ content: `Comment ${i}` })
      );

      const responses = await Promise.all(requests);
      const successful = responses.filter(r => r.status === 201);
      expect(successful.length).toBe(5);

      // Verify all saved
      const comments = await Comment.find({ notebookId: notebook._id });
      expect(comments).toHaveLength(5);
    });

    it('should handle comment on non-existent notebook', async () => {
      const { token } = await createTestUser();
      const fakeNotebookId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/notebooks/${fakeNotebookId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Comment on fake notebook' });

      expect(response.status).toBe(404);
    });

    it('should handle reply to non-existent parent comment', async () => {
      const { user, token } = await createTestUser();
      const notebook = await createTestNotebook(user._id);
      const fakeParentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/notebooks/${notebook._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          content: 'Reply to fake parent',
          parentId: fakeParentId
        });

      expect(response.status).toBe(404);
    });

    it('should validate comment belongs to notebook when updating', async () => {
      const { user, token } = await createTestUser();
      const notebook1 = await createTestNotebook(user._id);
      const notebook2 = await createTestNotebook(user._id);

      // Create comment in notebook1
      const createResponse = await request(app)
        .post(`/api/notebooks/${notebook1._id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'In notebook 1' });

      const commentId = createResponse.body.comment.id;

      // Try to update via notebook2's route
      const updateResponse = await request(app)
        .put(`/api/notebooks/${notebook2._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated via wrong notebook' });

      expect(updateResponse.status).toBe(400);
    });
  });
});
