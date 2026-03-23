import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
  Collapse,
  Tooltip,
  Alert,
  useTheme,
  alpha,
  Chip,
  Stack,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Reply as ReplyIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  ChatBubbleOutline as CommentIcon,
  Close as CloseIcon,
  ThumbUp as LikeIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import socketClient from '../utils/socketClient';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Comment item component
const CommentItem = ({
  comment,
  isReply = false,
  currentUser,
  userRole,
  accessLevel,
  onEdit,
  onDelete,
  onReply,
  replyingTo,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  submitting,
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const canModify = currentUser && (
    currentUser.id === comment.author?.id ||
    userRole === 'owner' ||
    accessLevel === 'owner'
  );

  const authorName = comment.author?.name || comment.guestAuthor?.name || 'Anonymous';
  const authorInitial = authorName[0]?.toUpperCase() || 'A';
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        sx={{
          mb: isReply ? 0 : 2,
          ml: isReply ? 4 : 0,
          pl: isReply ? 2 : 0,
          borderLeft: isReply ? `2px solid ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: isReply ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha('#000', 0.06)}`,
            '&:hover': {
              borderColor: alpha('#000', 0.12),
            },
            transition: 'border-color 0.2s ease',
          }}
        >
          {/* Comment header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Avatar
              sx={{
                width: isReply ? 28 : 36,
                height: isReply ? 28 : 36,
                fontSize: isReply ? '0.75rem' : '0.875rem',
                bgcolor: `hsl(${authorName.charCodeAt(0) * 10}, 60%, 50%)`,
              }}
            >
              {authorInitial}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Author and time */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {authorName}
                </Typography>
                {isReply && (
                  <Chip label="reply" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </Typography>
                {comment.edited && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    (edited)
                  </Typography>
                )}
              </Box>

              {/* Comment content */}
              <Typography
                variant="body2"
                sx={{
                  color: 'text.primary',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {comment.content}
              </Typography>

              {/* Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                {!isReply && (
                  <Button
                    size="small"
                    startIcon={<ReplyIcon sx={{ fontSize: '16px !important' }} />}
                    onClick={() => onReply(comment.id)}
                    sx={{
                      textTransform: 'none',
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      '&:hover': { bgcolor: alpha('#000', 0.04) },
                    }}
                  >
                    Reply
                  </Button>
                )}

                {canModify && (
                  <>
                    <Button
                      size="small"
                      startIcon={<EditIcon sx={{ fontSize: '16px !important' }} />}
                      onClick={() => onEdit(comment)}
                      sx={{
                        textTransform: 'none',
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        '&:hover': { bgcolor: alpha('#000', 0.04) },
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon sx={{ fontSize: '16px !important' }} />}
                      onClick={() => onDelete(comment.id, isReply, comment.parentId)}
                      sx={{
                        textTransform: 'none',
                        color: 'error.main',
                        fontSize: '0.75rem',
                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
                      }}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            {/* More menu */}
            {canModify && (
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{ color: 'text.secondary' }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem onClick={() => { onEdit(comment); setMenuAnchor(null); }}>
                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Edit</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => { onDelete(comment.id, isReply, comment.parentId); setMenuAnchor(null); }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Paper>

        {/* Reply input */}
        <Collapse in={replyingTo === comment.id}>
          <Box sx={{ mt: 1, ml: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Write a reply..."
              value={replyText || ''}
              onChange={(e) => onReplyTextChange(comment.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmitReply(comment.id);
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => onSubmitReply(comment.id)}
                      disabled={!replyText?.trim() || submitting}
                      color="primary"
                    >
                      {submitting ? <CircularProgress size={18} /> : <SendIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: alpha('#fff', 0.8),
                },
              }}
            />
          </Box>
        </Collapse>

        {/* Replies */}
        {hasReplies && (
          <Box sx={{ mt: 1 }}>
            {!isExpanded && (
              <Button
                size="small"
                onClick={() => setIsExpanded(true)}
                startIcon={<ExpandMoreIcon />}
                sx={{ ml: 6, textTransform: 'none', fontSize: '0.75rem' }}
              >
                Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
            <Collapse in={isExpanded}>
              <Box sx={{ mt: 1 }}>
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    isReply
                    currentUser={currentUser}
                    userRole={userRole}
                    accessLevel={accessLevel}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReply={onReply}
                  />
                ))}
                {hasReplies && (
                  <Button
                    size="small"
                    onClick={() => setIsExpanded(false)}
                    startIcon={<ExpandLessIcon />}
                    sx={{ ml: 6, textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Hide replies
                  </Button>
                )}
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

// Main CommentsPanel component
const CommentsPanel = ({ notebookId, userRole, accessLevel, isGuest }) => {
  const theme = useTheme();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/notebooks/${notebookId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(response.data.comments || []);
    } catch (err) {
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(response.data.user);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (notebookId) {
      fetchComments();
      fetchCurrentUser();
    }
  }, [notebookId]);

  // Socket.io listeners for real-time updates
  useEffect(() => {
    if (!notebookId || !socketClient.isConnected) return;

    const handleCommentAdded = (data) => {
      // Check if this comment is for this notebook
      const commentNotebookId = data.notebookId?.toString() || data.notebookId;
      if (commentNotebookId !== notebookId.toString()) return;

      setComments((prev) => {
        // Check if we already have this comment (avoid duplicates from our own actions)
        const exists = prev.some((c) => c.id === data.id) ||
          prev.some((c) => c.replies?.some((r) => r.id === data.id));
        if (exists) return prev;

        // If it's a reply, add to parent's replies
        if (data.parentId) {
          return prev.map((comment) => {
            if (comment.id === data.parentId) {
              const replyExists = comment.replies?.some((r) => r.id === data.id);
              if (replyExists) return comment;
              return { ...comment, replies: [...(comment.replies || []), data] };
            }
            return comment;
          });
        }
        // Otherwise, add as top-level comment
        return [...prev, data];
      });
    };

    const handleCommentUpdated = (data) => {
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === data.id) {
            return { ...comment, content: data.content, edited: true };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === data.id ? { ...reply, content: data.content, edited: true } : reply
              ),
            };
          }
          return comment;
        })
      );
    };

    const handleCommentDeleted = (data) => {
      const { commentId, parentId } = data;
      if (parentId) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: (comment.replies || []).filter((r) => r.id !== commentId),
              };
            }
            return comment;
          })
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    };

    socketClient.on('commentAdded', handleCommentAdded);
    socketClient.on('commentUpdated', handleCommentUpdated);
    socketClient.on('commentDeleted', handleCommentDeleted);

    return () => {
      socketClient.off('commentAdded');
      socketClient.off('commentUpdated');
      socketClient.off('commentDeleted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookId]);

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/notebooks/${notebookId}/comments`,
        { content: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) => [...prev, response.data.comment]);
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Add reply
  const handleAddReply = async (parentId) => {
    if (!replyText[parentId]?.trim() || submitting) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/notebooks/${notebookId}/comments`,
        { content: replyText[parentId].trim(), parentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentId
            ? { ...comment, replies: [...(comment.replies || []), response.data.comment] }
            : comment
        )
      );
      setReplyText((prev) => ({ ...prev, [parentId]: '' }));
      setReplyingTo(null);
    } catch (err) {
      setError('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId, isReply = false, parentId = null) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/notebooks/${notebookId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isReply && parentId) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === parentId
              ? { ...comment, replies: (comment.replies || []).filter((r) => r.id !== commentId) }
              : comment
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  // Edit comment
  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setNewComment(comment.content);
  };

  // Update comment
  const handleUpdateComment = async () => {
    if (!editingComment || !newComment.trim() || submitting) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/notebooks/${notebookId}/comments/${editingComment.id}`,
        { content: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === editingComment.id
            ? { ...comment, content: newComment.trim(), edited: true }
            : {
                ...comment,
                replies: comment.replies?.map((r) =>
                  r.id === editingComment.id ? { ...r, content: newComment.trim(), edited: true } : r
                ),
              }
        )
      );
      setEditingComment(null);
      setNewComment('');
    } catch (err) {
      setError('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyTextChange = (parentId, text) => {
    setReplyText((prev) => ({ ...prev, [parentId]: text }));
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: alpha(theme.palette.background.default, 0.98),
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: alpha('#000', 0.08),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CommentIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Comments
          </Typography>
          <Chip
            label={comments.length}
            size="small"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Box>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Comments list */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CommentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              No comments yet. Be the first to comment!
            </Typography>
          </Box>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                userRole={userRole}
                accessLevel={accessLevel}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onReply={(id) => setReplyingTo(replyingTo === id ? null : id)}
                replyingTo={replyingTo}
                replyText={replyText[comment.id]}
                onReplyTextChange={handleReplyTextChange}
                onSubmitReply={handleAddReply}
                submitting={submitting}
              />
            ))}
          </AnimatePresence>
        )}
      </Box>

      {/* Add comment input */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: alpha('#000', 0.08),
          bgcolor: alpha('#fff', 0.8),
        }}
      >
        {editingComment && (
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Editing comment
            </Typography>
            <IconButton size="small" onClick={() => { setEditingComment(null); setNewComment(''); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              editingComment ? handleUpdateComment() : handleAddComment();
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={editingComment ? handleUpdateComment : handleAddComment}
                  disabled={!newComment.trim() || submitting}
                  color="primary"
                >
                  {submitting ? <CircularProgress size={20} /> : <SendIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: '#fff',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default CommentsPanel;
