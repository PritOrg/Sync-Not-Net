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
  ListItemSecondaryAction,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
  Collapse,
  Fade,
  Tooltip,
  Alert,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Reply as ReplyIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  ChatBubbleOutline as CommentIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const CommentsPanel = ({ notebookId, userRole, accessLevel, isGuest }) => {
  const theme = useTheme();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [editText, setEditText] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);

  // Fetch comments on mount and when notebookId changes
  useEffect(() => {
    if (notebookId) {
      fetchComments();
      fetchCurrentUser();
    }
  }, [notebookId]);

  // Fetch the current user's info
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  // Fetch all comments for this notebook
  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/notebooks/${notebookId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Organize comments into a hierarchical structure
      const commentsData = response.data.comments || [];
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Add a new comment
  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const payload = { content: newComment.trim() };
      const response = await axios.post(
        `${API_BASE_URL}/api/notebooks/${notebookId}/comments`, 
        payload, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add the new comment to our state
      const newCommentData = response.data.comment;
      setComments(prev => [...prev, newCommentData]);
      
      // Clear the input
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Add a reply to a comment
  const handleAddReply = async (parentId) => {
    if (!replyText[parentId]?.trim() || submitting) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const payload = {
        content: replyText[parentId].trim(),
        parentId: parentId
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/api/notebooks/${notebookId}/comments`, 
        payload, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add the new reply to our state
      const newReplyData = response.data.comment;
      
      // Update the comments state with the new reply
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReplyData]
            };
          }
          return comment;
        });
      });
      
      // Clear the reply state
      setReplyText(prev => ({ ...prev, [parentId]: '' }));
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit a comment
  const handleEditComment = async (commentId, isReply = false, parentId = null) => {
    if (!editText[commentId]?.trim() || submitting) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const payload = { content: editText[commentId].trim() };
      
      await axios.put(
        `${API_BASE_URL}/api/notebooks/${notebookId}/comments/${commentId}`, 
        payload, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the comment in our state
      if (isReply && parentId) {
        setComments(prev => {
          return prev.map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: (comment.replies || []).map(reply => 
                  reply.id === commentId ? { ...reply, content: editText[commentId] } : reply
                )
              };
            }
            return comment;
          });
        });
      } else {
        setComments(prev => {
          return prev.map(comment => 
            comment.id === commentId ? { ...comment, content: editText[commentId] } : comment
          );
        });
      }
      
      // Clear the edit state
      setEditText(prev => ({ ...prev, [commentId]: '' }));
      setEditingId(null);
    } catch (error) {
      console.error('Error editing comment:', error);
      setError('Failed to edit comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId, isReply = false, parentId = null) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(
        `${API_BASE_URL}/api/notebooks/${notebookId}/comments/${commentId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove the comment from our state
      if (isReply && parentId) {
        setComments(prev => {
          return prev.map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: (comment.replies || []).filter(reply => reply.id !== commentId)
              };
            }
            return comment;
          });
        });
      } else {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    } finally {
      setSubmitting(false);
      handleCloseMenu();
    }
  };

  // Toggle reply form visibility
  const handleToggleReply = (commentId) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    if (!replyText[commentId]) {
      setReplyText(prev => ({ ...prev, [commentId]: '' }));
    }
  };

  // Start editing a comment
  const handleStartEditing = (commentId, content) => {
    setEditingId(commentId);
    setEditText(prev => ({ ...prev, [commentId]: content }));
    handleCloseMenu();
  };

  // Toggle expanded state for comment replies
  const handleToggleExpand = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Handle opening the menu for a comment
  const handleOpenMenu = (event, commentId) => {
    setAnchorEl(event.currentTarget);
    setMenuTarget(commentId);
  };

  // Close the menu
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuTarget(null);
  };

  // Check if the current user can edit/delete a comment
  const canModifyComment = (comment) => {
    if (!currentUser) return false;
    return currentUser.id === comment.author.id || userRole === 'owner' || accessLevel === 'owner';
  };

  // Render a comment
  const renderComment = (comment, isReply = false, parentId = null) => {
    const isEditing = editingId === comment.id;
    const isExpanded = expandedComments[comment.id];
    const hasReplies = comment.replies && comment.replies.length > 0;
    
    return (
      <React.Fragment key={comment.id}>
        <ListItem
          alignItems="flex-start"
          sx={{
            pl: isReply ? 4 : 2,
            pr: 2,
            py: 1.5,
            backgroundColor: isReply ? 'rgba(0,0,0,0.01)' : 'transparent'
          }}
        >
          <ListItemAvatar>
            <Avatar
              alt={comment.author.name}
              src={comment.author.avatar}
              sx={{ 
                width: isReply ? 30 : 40, 
                height: isReply ? 30 : 40,
                bgcolor: theme.palette.primary.main
              }}
            >
              {comment.author.name.charAt(0).toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" component="span">
                  {comment.author.name}
                  {isReply && (
                    <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                      (reply)
                    </Typography>
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
            }
            secondary={
              <>
                {isEditing ? (
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      value={editText[comment.id] || ''}
                      onChange={(e) => setEditText({ ...editText, [comment.id]: e.target.value })}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                      <Button 
                        size="small" 
                        onClick={() => setEditingId(null)}
                        color="inherit"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleEditComment(comment.id, isReply, parentId)}
                        disabled={submitting}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.primary"
                    component="div"
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      mt: 0.5,
                      overflowWrap: 'break-word'
                    }}
                  >
                    {comment.content}
                  </Typography>
                )}

                {!isEditing && !isReply && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      size="small"
                      startIcon={<ReplyIcon fontSize="small" />}
                      onClick={() => handleToggleReply(comment.id)}
                      sx={{ textTransform: 'none', minWidth: 0, p: 0 }}
                    >
                      Reply
                    </Button>
                    
                    {hasReplies && (
                      <Button
                        size="small"
                        endIcon={isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        onClick={() => handleToggleExpand(comment.id)}
                        sx={{ textTransform: 'none', minWidth: 0, p: 0 }}
                      >
                        {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                      </Button>
                    )}
                  </Box>
                )}

                {/* Reply form */}
                {replyingTo === comment.id && !isReply && (
                  <Box sx={{ mt: 2, ml: 2 }}>
                    <TextField
                      fullWidth
                      placeholder="Write a reply..."
                      multiline
                      minRows={2}
                      value={replyText[comment.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                      variant="outlined"
                      size="small"
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                      <Button 
                        size="small" 
                        onClick={() => handleToggleReply(comment.id)}
                        color="inherit"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        endIcon={<SendIcon />}
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyText[comment.id] || submitting}
                      >
                        Reply
                      </Button>
                    </Box>
                  </Box>
                )}
              </>
            }
            sx={{ margin: 0 }}
          />

          {canModifyComment(comment) && (
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                size="small"
                onClick={(e) => handleOpenMenu(e, comment.id)}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          )}
        </ListItem>

        {/* Replies */}
        {!isReply && hasReplies && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List disablePadding>
              {comment.replies.map(reply => renderComment(reply, true, comment.id))}
            </List>
          </Collapse>
        )}

        <Divider variant={isReply ? "inset" : "fullWidth"} component="li" />
      </React.Fragment>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <CommentIcon color="primary" />
        <Typography variant="subtitle1" fontWeight="medium">
          Comments
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Comments list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              No comments yet. Be the first to comment!
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper', py: 0 }}>
            {comments.map(comment => renderComment(comment))}
          </List>
        )}
      </Box>
      
      {/* Add comment form */}
      {(userRole !== 'viewer' || accessLevel !== 'read') && !isGuest && (
        <Box sx={{ 
          p: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper' 
        }}>
          <TextField
            fullWidth
            placeholder="Add a comment..."
            multiline
            minRows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            variant="outlined"
            size="small"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button 
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleAddComment}
              disabled={!newComment.trim() || submitting}
              sx={{ borderRadius: 1, mt: 1 }}
            >
              {submitting ? 'Sending...' : 'Comment'}
            </Button>
          </Box>
        </Box>
      )}
      
      {/* Comment menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {menuTarget && (
          <>
            <MenuItem onClick={() => {
              const comment = comments.find(c => c.id === menuTarget) || 
                comments.flatMap(c => c.replies || []).find(r => r.id === menuTarget);
              if (comment) {
                handleStartEditing(menuTarget, comment.content);
              }
            }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={() => {
              const isReply = !comments.find(c => c.id === menuTarget);
              const parentId = isReply ? 
                comments.find(c => (c.replies || []).some(r => r.id === menuTarget))?.id : null;
              handleDeleteComment(menuTarget, isReply, parentId);
            }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </Paper>
  );
};

export default CommentsPanel;