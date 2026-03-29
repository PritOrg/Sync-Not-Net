import React, { useState, useEffect, useCallback } from 'react';
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
  Badge,
  Skeleton,
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
  ThumbUpOutlined as LikeOutlineIcon,
  Done as ResolveIcon,
  DoneAll as ResolvedIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import socketClient from '../utils/socketClient';
import config from '../config';
import apiErrorHandler from '../utils/errorHandler';

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
  onLike,
  replyingTo,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  submitting,
  depth = 0,
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
  const hasValidCommentId = Boolean(comment.id && comment.id !== 'undefined');

  const getRelativeTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return format(d, 'MMM d, yyyy h:mm a');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        sx={{
          mb: isReply ? 1 : 2,
          ml: isReply ? Math.min(depth * 4, 12) : 0,
          pl: isReply ? 2 : 0,
          borderLeft: isReply ? `2px solid ${alpha(theme.palette.primary.main, 0.15 + depth * 0.05)}` : 'none',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: isReply 
              ? alpha(theme.palette.background.default, 0.5) 
              : comment.resolved 
              ? alpha('#f0fdf4', 0.5)
              : alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha('#000', 0.06)}`,
            '&:hover': {
              borderColor: alpha('#000', 0.12),
            },
            transition: 'border-color 0.2s ease',
            position: 'relative',
            ...(comment.resolved && {
              borderLeft: '3px solid #16a34a',
            }),
          }}
        >
          {/* Resolved indicator */}
          {comment.resolved && (
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              <Chip
                icon={<ResolvedIcon sx={{ fontSize: '14px !important' }} />}
                label="Resolved"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  bgcolor: '#f0fdf4',
                  color: '#16a34a',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: '#16a34a' },
                }}
              />
            </Box>
          )}

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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {authorName}
                </Typography>
                {isReply && (
                  <Chip 
                    label="reply" 
                    size="small" 
                    sx={{ 
                      height: 18, 
                      fontSize: '0.6rem',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }} 
                  />
                )}
                <Tooltip title={format(new Date(comment.createdAt), 'PPpp')}>
                  <Typography variant="caption" color="text.secondary" sx={{ cursor: 'default' }}>
                    {getRelativeTime(comment.createdAt)}
                  </Typography>
                </Tooltip>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {!isReply && (
                  <Button
                    size="small"
                    startIcon={<ReplyIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={() => onReply(comment.id)}
                    disabled={!hasValidCommentId}
                    sx={{
                      textTransform: 'none',
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      minWidth: 'auto',
                      px: 1,
                      '&:hover': { bgcolor: alpha('#000', 0.04) },
                    }}
                  >
                    Reply
                  </Button>
                )}

                <Tooltip title={comment.likes?.includes(currentUser?.id) ? 'Unlike' : 'Like'}>
                  <IconButton
                    size="small"
                    onClick={() => onLike?.(comment.id)}
                    disabled={!hasValidCommentId}
                    sx={{
                      color: comment.likes?.includes(currentUser?.id) ? '#6366f1' : 'text.secondary',
                      '&:hover': { bgcolor: alpha('#6366f1', 0.08) },
                    }}
                  >
                    {comment.likes?.includes(currentUser?.id) ? (
                      <LikeIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <LikeOutlineIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </Tooltip>
                {comment.likes?.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {comment.likes.length}
                  </Typography>
                )}

                {canModify && (
                  <>
                    <Button
                      size="small"
                      startIcon={<EditIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => onEdit(comment)}
                      disabled={!hasValidCommentId}
                      sx={{
                        textTransform: 'none',
                        color: 'text.secondary',
                        fontSize: '0.7rem',
                        minWidth: 'auto',
                        px: 1,
                        '&:hover': { bgcolor: alpha('#000', 0.04) },
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => onDelete(comment.id, isReply, comment.parentId)}
                      disabled={!hasValidCommentId}
                      sx={{
                        textTransform: 'none',
                        color: 'error.main',
                        fontSize: '0.7rem',
                        minWidth: 'auto',
                        px: 1,
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
                disabled={!hasValidCommentId}
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
          <Box sx={{ mt: 1, ml: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={`Reply to ${authorName}...`}
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
                      {submitting ? <CircularProgress size={16} /> : <SendIcon fontSize="small" />}
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
                startIcon={<ExpandMoreIcon sx={{ fontSize: '14px !important' }} />}
                sx={{ 
                  ml: 2, 
                  textTransform: 'none', 
                  fontSize: '0.7rem',
                  color: theme.palette.primary.main,
                }}
              >
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
            <Collapse in={isExpanded}>
              <Box sx={{ mt: 1 }}>
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    isReply
                    depth={depth + 1}
                    currentUser={currentUser}
                    userRole={userRole}
                    accessLevel={accessLevel}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReply={onReply}
                    onLike={onLike}
                    replyingTo={replyingTo}
                    replyText={replyText}
                    onReplyTextChange={onReplyTextChange}
                    onSubmitReply={onSubmitReply}
                    submitting={submitting}
                  />
                ))}
                {isExpanded && (
                  <Button
                    size="small"
                    onClick={() => setIsExpanded(false)}
                    startIcon={<ExpandLessIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{ 
                      ml: 2, 
                      textTransform: 'none', 
                      fontSize: '0.7rem',
                      color: 'text.secondary',
                    }}
                  >
                    Hide
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

// Comment skeleton loader
const CommentSkeleton = () => (
  <Box sx={{ mb: 2 }}>
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: alpha('#000', 0.06) }}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Skeleton variant="circular" width={36} height={36} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Skeleton variant="text" width={80} height={20} />
            <Skeleton variant="text" width={50} height={16} />
          </Box>
          <Skeleton variant="text" width="90%" height={16} />
          <Skeleton variant="text" width="70%" height={16} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Skeleton variant="text" width={50} height={16} />
            <Skeleton variant="text" width={40} height={16} />
          </Box>
        </Box>
      </Box>
    </Paper>
  </Box>
);

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
  const [sortBy, setSortBy] = useState('newest');

  const normalizeComment = useCallback((comment) => {
    if (!comment) return null;

    const normalizedId = comment.id || comment._id;
    const normalizedAuthor = comment.author
      ? {
          ...comment.author,
          id: comment.author.id || comment.author._id,
        }
      : comment.author;

    const normalizedReplies = (comment.replies || []).map((reply) => normalizeComment(reply)).filter(Boolean);

    return {
      ...comment,
      id: normalizedId,
      author: normalizedAuthor,
      replies: normalizedReplies,
    };
  }, []);

  const hasCommentId = useCallback((commentId) => Boolean(commentId && commentId !== 'undefined'), []);

  // Count total comments including replies
  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/api/notebooks/${notebookId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let fetchedComments = (response.data.comments || []).map((comment) => normalizeComment(comment)).filter(Boolean);
      
      // Sort comments
      if (sortBy === 'oldest') {
        fetchedComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else {
        fetchedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      
      setComments(fetchedComments);
    } catch (err) {
      setError(apiErrorHandler.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [notebookId, normalizeComment, sortBy]);

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${config.apiUrl}/api/users/profile`, {
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
  }, [notebookId, fetchComments]);

  // Socket.io listeners for real-time updates
  useEffect(() => {
    if (!notebookId || !socketClient.isConnected) return;

    const handleCommentAdded = (data) => {
      // Check if this comment is for this notebook
      const normalizedComment = normalizeComment(data);
      if (!normalizedComment || !hasCommentId(normalizedComment.id)) return;

      const commentNotebookId = normalizedComment.notebookId?.toString() || normalizedComment.notebookId;
      if (commentNotebookId !== notebookId.toString()) return;

      setComments((prev) => {
        // Check if we already have this comment (avoid duplicates from our own actions)
        const exists = prev.some((c) => c.id === normalizedComment.id) ||
          prev.some((c) => c.replies?.some((r) => r.id === normalizedComment.id));
        if (exists) return prev;

        // If it's a reply, add to parent's replies
        if (normalizedComment.parentId) {
          return prev.map((comment) => {
            if (comment.id === normalizedComment.parentId) {
              const replyExists = comment.replies?.some((r) => r.id === normalizedComment.id);
              if (replyExists) return comment;
              return { ...comment, replies: [...(comment.replies || []), normalizedComment] };
            }
            return comment;
          });
        }
        // Otherwise, add as top-level comment
        return [...prev, normalizedComment];
      });
    };

    const handleCommentUpdated = (data) => {
      const normalizedComment = normalizeComment(data);
      if (!normalizedComment || !hasCommentId(normalizedComment.id)) return;

      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === normalizedComment.id) {
            return { ...comment, content: normalizedComment.content, edited: true };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === normalizedComment.id
                  ? { ...reply, content: normalizedComment.content, edited: true }
                  : reply
              ),
            };
          }
          return comment;
        })
      );
    };

    const handleCommentDeleted = (data) => {
      const { commentId, parentId } = data;
      if (!hasCommentId(commentId)) return;

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

    const handleCommentLiked = (data) => {
      const { commentId, likes } = data || {};
      if (!hasCommentId(commentId)) return;

      setComments((prev) => prev.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, likes: likes || [] };
        }

        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => (
              reply.id === commentId
                ? { ...reply, likes: likes || [] }
                : reply
            )),
          };
        }

        return comment;
      }));
    };

    socketClient.on('commentAdded', handleCommentAdded);
    socketClient.on('commentUpdated', handleCommentUpdated);
    socketClient.on('commentDeleted', handleCommentDeleted);
    socketClient.on('commentLiked', handleCommentLiked);

    return () => {
      socketClient.off('commentAdded');
      socketClient.off('commentUpdated');
      socketClient.off('commentDeleted');
      socketClient.off('commentLiked');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCommentId, normalizeComment, notebookId]);

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.apiUrl}/api/notebooks/${notebookId}/comments`,
        { content: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const normalizedComment = normalizeComment(response.data.comment);
      if (normalizedComment && hasCommentId(normalizedComment.id)) {
        setComments((prev) => {
          const exists = prev.some((c) => c.id === normalizedComment.id) ||
            prev.some((c) => c.replies?.some((r) => r.id === normalizedComment.id));
          return exists ? prev : [...prev, normalizedComment];
        });
      }
      setNewComment('');
    } catch (err) {
      setError(apiErrorHandler.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Add reply
  const handleAddReply = async (parentId) => {
    if (!hasCommentId(parentId) || !replyText[parentId]?.trim() || submitting) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.apiUrl}/api/notebooks/${notebookId}/comments`,
        { content: replyText[parentId].trim(), parentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const normalizedReply = normalizeComment(response.data.comment);

      if (normalizedReply && hasCommentId(normalizedReply.id)) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id !== parentId) return comment;
            const replyExists = (comment.replies || []).some((r) => r.id === normalizedReply.id);
            if (replyExists) return comment;
            return { ...comment, replies: [...(comment.replies || []), normalizedReply] };
          })
        );
      }
      setReplyText((prev) => ({ ...prev, [parentId]: '' }));
      setReplyingTo(null);
    } catch (err) {
      setError(apiErrorHandler.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId, isReply = false, parentId = null) => {
    if (!hasCommentId(commentId)) {
      setError('This comment is missing an ID. Please refresh and try again.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiUrl}/api/notebooks/${notebookId}/comments/${commentId}`, {
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
      setError(apiErrorHandler.getErrorMessage(err));
    }
  };

  // Edit comment
  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setNewComment(comment.content);
  };

  // Like/unlike comment
  const handleLikeComment = async (commentId) => {
    if (!hasCommentId(commentId)) {
      setError('This comment is missing an ID. Please refresh and try again.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.apiUrl}/api/notebooks/${notebookId}/comments/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const nextLikes = response.data?.likes || [];
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: nextLikes,
          };
        }
        // Check replies too
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  likes: nextLikes,
                };
              }
              return reply;
            }),
          };
        }
        return comment;
      }));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Update comment
  const handleUpdateComment = async () => {
    if (!editingComment || !hasCommentId(editingComment.id) || !newComment.trim() || submitting) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${config.apiUrl}/api/notebooks/${notebookId}/comments/${editingComment.id}`,
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
      setError(apiErrorHandler.getErrorMessage(err));
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
          <Badge
            badgeContent={totalComments}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                minWidth: 18,
                height: 18,
              },
            }}
          />
        </Box>
        <Tooltip title={sortBy === 'newest' ? 'Newest first' : 'Oldest first'}>
          <IconButton
            size="small"
            onClick={() => setSortBy(prev => prev === 'newest' ? 'oldest' : 'newest')}
            sx={{ color: 'text.secondary' }}
          >
            <SortIcon fontSize="small" />
          </IconButton>
        </Tooltip>
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
          <Stack spacing={0}>
            {[1, 2, 3].map((i) => (
              <CommentSkeleton key={i} />
            ))}
          </Stack>
        ) : comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <CommentIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom>
              No comments yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Be the first to share your thoughts!
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
                onLike={handleLikeComment}
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
