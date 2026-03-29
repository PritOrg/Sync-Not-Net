import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Fade,
  Snackbar,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Tooltip,
  Stack,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  Book as BookIcon,
  Share as ShareIcon,
  Public as PublicIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as DeclineIcon,
  Send as SendIcon,
  Inbox as InboxIcon,
  AccessTime as PendingIcon,
  DoneAll as AcceptedIcon,
  Block as DeclinedIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  DeleteOutline as CancelReqIcon,
  PeopleAlt as PeopleIcon,
  NoteAdd as NoteAddIcon,
  History as HistoryIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fadeIn, slideIn, bounceIn, slideInBottom, getAnimationStyles } from '../utils/animations';
import axiosInstance from '../utils/axiosConfig';
import api from '../utils/apiRoutes';
import apiErrorHandler from '../utils/errorHandler';

function TabPanel({ children, value, index, ...other }) {
  return (
    <Box role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </Box>
  );
}

const accessColors = {
  read: { bg: '#f0fdf4', color: '#16a34a', label: 'Read' },
  write: { bg: '#f0f4ff', color: '#6366f1', label: 'Write' },
  admin: { bg: '#fef3c7', color: '#d97706', label: 'Admin' },
};

const roleColors = {
  user: { bg: '#f0f4ff', color: '#6366f1', label: 'User' },
  admin: { bg: '#fef3c7', color: '#d97706', label: 'Admin' },
  editor: { bg: '#f0fdf4', color: '#16a34a', label: 'Editor' },
};

const statusConfig = {
  pending: { icon: PendingIcon, color: '#f59e0b', bg: '#fffbeb', label: 'Pending' },
  accepted: { icon: AcceptedIcon, color: '#16a34a', bg: '#f0fdf4', label: 'Accepted' },
  declined: { icon: DeclinedIcon, color: '#dc2626', bg: '#fef2f2', label: 'Declined' },
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const RequestCard = ({ request, type, onAccept, onDecline, onCancel, processing }) => {
  const isOutgoing = type === 'outgoing';
  const person = isOutgoing ? request.receiver : request.sender;
  const sc = statusConfig[request.status];
  const ac = accessColors[request.requestedAccess] || accessColors.write;

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: request.status === 'pending' ? alpha('#6366f1', 0.2) : '#e5e7eb',
        borderRadius: 3,
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: request.status === 'pending' ? '#6366f1' : '#d1d5db',
          boxShadow: request.status === 'pending'
            ? '0 4px 20px rgba(99, 102, 241, 0.1)'
            : '0 2px 12px rgba(0,0,0,0.06)',
          transform: 'translateY(-2px)',
        },
        animation: `${slideInBottom} 0.4s ease both`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: '#6366f1',
              fontSize: '1.1rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {person?.name?.charAt(0).toUpperCase() || '?'}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1f2937' }}>
                {person?.name || 'Unknown User'}
              </Typography>
              <Chip
                icon={<sc.icon sx={{ fontSize: '14px !important' }} />}
                label={sc.label}
                size="small"
                sx={{
                  bgcolor: sc.bg,
                  color: sc.color,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 26,
                  '& .MuiChip-icon': { color: sc.color },
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {isOutgoing ? 'Request to collaborate on' : 'Wants to collaborate on'}{' '}
              <Typography
                component="span"
                variant="body2"
                fontWeight={600}
                color="#6366f1"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => window.open(`/Notebook/${request.notebook?.urlIdentifier}`, '_blank')}
              >
                {request.notebook?.title || 'Untitled Notebook'}
              </Typography>
            </Typography>

            {request.message && (
              <Typography
                variant="body2"
                sx={{
                  color: '#6b7280',
                  fontStyle: 'italic',
                  bgcolor: '#f9fafb',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  mb: 1.5,
                  borderLeft: '3px solid #e5e7eb',
                }}
              >
                "{request.message}"
              </Typography>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip
                  label={ac.label + ' Access'}
                  size="small"
                  sx={{
                    bgcolor: ac.bg,
                    color: ac.color,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(request.createdAt)}
                </Typography>
              </Box>

              {request.status === 'pending' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!isOutgoing && (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={processing === request.id ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                        onClick={() => onAccept(request.id)}
                        disabled={processing === request.id}
                        sx={{
                          bgcolor: '#16a34a',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          px: 2,
                          borderRadius: 2,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#15803d' },
                          '&:disabled': { bgcolor: '#d1d5db' },
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={processing === `${request.id}-decline` ? <CircularProgress size={14} color="inherit" /> : <DeclineIcon />}
                        onClick={() => onDecline(request.id)}
                        disabled={processing === request.id || processing === `${request.id}-decline`}
                        sx={{
                          color: '#dc2626',
                          borderColor: '#fecaca',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          px: 2,
                          borderRadius: 2,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#fef2f2', borderColor: '#f87171' },
                        }}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {isOutgoing && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={processing === request.id ? <CircularProgress size={14} color="inherit" /> : <CancelReqIcon />}
                      onClick={() => onCancel(request.id)}
                      disabled={processing === request.id}
                      sx={{
                        color: '#6b7280',
                        borderColor: '#d1d5db',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        px: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#f9fafb', borderColor: '#9ca3af' },
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const RequestSkeleton = () => (
  <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3 }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="40%" height={28} />
          <Skeleton variant="text" width="70%" height={22} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1, mb: 1.5 }} />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 3 }} />
            <Skeleton variant="text" width={50} height={20} />
          </Box>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 8,
      px: 3,
    }}
  >
    <Box
      sx={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        bgcolor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: 'auto',
        mb: 2.5,
      }}
    >
      <Icon sx={{ fontSize: 36, color: '#9ca3af' }} />
    </Box>
    <Typography variant="h6" fontWeight={600} color="#374151" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340, mx: 'auto' }}>
      {description}
    </Typography>
  </Box>
);

const ActivityItem = ({ activity }) => {
  const { id, title, updatedAt, isOwner, accessLevel, isPublic } = activity;
  const accessColors = {
    owner: { bg: '#f0f4ff', color: '#6366f1', label: 'Owner' },
    admin: { bg: '#fef3c7', color: '#d97706', label: 'Admin' },
    write: { bg: '#f0fdf4', color: '#16a34a', label: 'Write' },
    read: { bg: '#f3f4f6', color: '#6b7280', label: 'Read' },
  };
  const ac = accessColors[accessLevel] || accessColors.read;

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid #e5e7eb',
        borderRadius: 3,
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: '#6366f1',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: isOwner ? '#f0f4ff' : '#f0fdf4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isOwner ? (
            <BookIcon sx={{ color: '#6366f1', fontSize: 20 }} />
          ) : (
            <GroupIcon sx={{ color: '#16a34a', fontSize: 20 }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#1f2937', mb: 0.5 }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={ac.label}
              size="small"
              sx={{
                bgcolor: ac.bg,
                color: ac.color,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
              }}
            />
            {isPublic && (
              <Chip
                label="Public"
                size="small"
                sx={{
                  bgcolor: '#f0fdf4',
                  color: '#16a34a',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              {formatTimeAgo(updatedAt)}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={() => window.open(`/Notebook/${id}`, '_blank')}
          sx={{ color: '#6366f1' }}
        >
          <ViewIcon fontSize="small" />
        </IconButton>
      </CardContent>
    </Card>
  );
};

const SharedNotebookItem = ({ notebook }) => {
  const { _id, title, updatedAt, creatorID, collaborators, permissions } = notebook;
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id;

  // Find current user's access level
  const myCollab = collaborators?.find(c => (c.userId?._id || c.userId) === currentUserId);
  const accessLevel = myCollab?.access || 'read';
  const accessColors = {
    admin: { bg: '#fef3c7', color: '#d97706', label: 'Admin' },
    write: { bg: '#f0fdf4', color: '#16a34a', label: 'Edit' },
    read: { bg: '#f3f4f6', color: '#6b7280', label: 'View' },
  };
  const ac = accessColors[accessLevel] || accessColors.read;
  const ownerName = creatorID?.name || 'Unknown';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid #e5e7eb',
        borderRadius: 3,
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: '#6366f1',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: '#f0fdf4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShareIcon sx={{ color: '#16a34a', fontSize: 22 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1f2937', mb: 0.5 }} noWrap>
            {title || 'Untitled'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={ac.label}
              size="small"
              sx={{
                bgcolor: ac.bg,
                color: ac.color,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              by {ownerName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              | {formatTimeAgo(updatedAt)}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={() => window.open(`/Notebook/${notebook.urlIdentifier || _id}`, '_blank')}
          sx={{
            color: '#6366f1',
            bgcolor: '#f0f4ff',
            '&:hover': { bgcolor: '#e0e7ff' },
          }}
        >
          <ViewIcon fontSize="small" />
        </IconButton>
      </CardContent>
    </Card>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState('');

  // Profile data
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    role: 'user',
    profilePicture: null,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [userStats, setUserStats] = useState({
    totalNotebooks: 0,
    sharedNotebooks: 0,
    publicNotebooks: 0,
    totalCollaborators: 0,
    memberSince: new Date(),
    lastLogin: null,
    profilePicture: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Collaboration requests
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [requestFilter, setRequestFilter] = useState('pending');
  const [outgoingFilter, setOutgoingFilter] = useState('all');
  const [requestCounts, setRequestCounts] = useState({
    incoming: { pending: 0, total: 0 },
    outgoing: { pending: 0, total: 0 },
  });
  const [requestTab, setRequestTab] = useState(0);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [sharedNotebooks, setSharedNotebooks] = useState([]);
  const [sharedLoading, setSharedLoading] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axiosInstance.get(api.profile());
      const user = response.data.user;
      if (user) {
        setUserData(user);
        setFormData((prev) => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
        }));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(apiErrorHandler.getErrorMessage(err));
    }
  }, []);

  const fetchUserStats = useCallback(async () => {
    try {
      const response = await axiosInstance.get(api.userStats());
      if (response.data.stats) {
        setUserStats(response.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const fetchRequestCounts = useCallback(async () => {
    try {
      const response = await axiosInstance.get(api.collaborationRequestCounts());
      setRequestCounts(response.data);
    } catch (err) {
      console.error('Error fetching request counts:', err);
    }
  }, []);

  const fetchIncomingRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const params = {};
      if (requestFilter !== 'all') params.status = requestFilter;
      const response = await axiosInstance.get(api.incomingRequests(), { params });
      setIncomingRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error fetching incoming requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  }, [requestFilter]);

  const fetchOutgoingRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const params = {};
      if (outgoingFilter !== 'all') params.status = outgoingFilter;
      const response = await axiosInstance.get(api.outgoingRequests(), { params });
      setOutgoingRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error fetching outgoing requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  }, [outgoingFilter]);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const response = await axiosInstance.get(api.userActivity());
      setActivity(response.data.activity || []);
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchSharedNotebooks = useCallback(async () => {
    setSharedLoading(true);
    try {
      const response = await axiosInstance.get(api.notebookShared());
      setSharedNotebooks(response.data.notebooks || []);
    } catch (err) {
      console.error('Error fetching shared notebooks:', err);
    } finally {
      setSharedLoading(false);
    }
  }, []);

  useEffect(() => {
    // Parallel fetch for profile data on mount
    Promise.allSettled([
      fetchUserProfile(),
      fetchUserStats(),
      fetchRequestCounts(),
    ]).catch(console.error);
  }, [fetchUserProfile, fetchUserStats, fetchRequestCounts]);

  useEffect(() => {
    if (activeTab === 2) {
      if (requestTab === 0) {
        fetchIncomingRequests();
      } else {
        fetchOutgoingRequests();
      }
    } else if (activeTab === 3) {
      fetchSharedNotebooks();
    } else if (activeTab === 4) {
      fetchActivity();
    }
  }, [activeTab, requestTab, fetchIncomingRequests, fetchOutgoingRequests, fetchSharedNotebooks, fetchActivity]);

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.put(api.updateProfile(), {
        name: formData.name,
        email: formData.email,
      });
      const data = response.data;
      setUserData(data.user);
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      setIsEditing(false);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...currentUser, name: data.user.name, email: data.user.email }));
    } catch (err) {
      setSnackbar({
        open: true,
        message: apiErrorHandler.getErrorMessage(err),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.put(api.changePassword(), {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSnackbar({ open: true, message: 'Password changed successfully!', severity: 'success' });
      setShowPasswordDialog(false);
      setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setError(apiErrorHandler.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setProcessingId(requestId);
    try {
      await axiosInstance.put(api.acceptRequest(requestId));
      setSnackbar({ open: true, message: 'Collaboration request accepted!', severity: 'success' });
      fetchIncomingRequests();
      fetchRequestCounts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: apiErrorHandler.getErrorMessage(err),
        severity: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    setProcessingId(`${requestId}-decline`);
    try {
      await axiosInstance.put(`/api/collaboration-requests/${requestId}/decline`);
      setSnackbar({ open: true, message: 'Collaboration request declined', severity: 'info' });
      fetchIncomingRequests();
      fetchRequestCounts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: apiErrorHandler.getErrorMessage(err),
        severity: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelRequest = async (requestId) => {
    setProcessingId(requestId);
    try {
      await axiosInstance.delete(`/api/collaboration-requests/${requestId}/cancel`);
      setSnackbar({ open: true, message: 'Request cancelled', severity: 'info' });
      fetchOutgoingRequests();
      fetchRequestCounts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: apiErrorHandler.getErrorMessage(err),
        severity: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const stats = [
    { icon: BookIcon, label: 'Total Notebooks', value: userStats.totalNotebooks, color: '#10b981', bg: '#ecfdf5' },
    { icon: ShareIcon, label: 'Shared Notebooks', value: userStats.sharedNotebooks, color: '#f59e0b', bg: '#fffbeb' },
    { icon: PublicIcon, label: 'Public Notebooks', value: userStats.publicNotebooks, color: '#8b5cf6', bg: '#faf5ff' },
    { icon: GroupIcon, label: 'Invited Collaborators', value: userStats.totalCollaborators, color: '#06b6d4', bg: '#f0fdfa' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f8fa', py: 4 }}>
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Box>
            {/* Back Button */}
            <Box sx={{ mb: 3 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/notebooks')}
                sx={{ color: '#6b7280', '&:hover': { bgcolor: '#f3f4f6' } }}
              >
                Back to Notebooks
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Header */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
                color: 'white',
                ...getAnimationStyles(fadeIn, 'normal', '0.6s'),
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={userData.profilePicture}
                      imgProps={{ style: { objectFit: 'cover' } }}
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        border: '4px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        bgcolor: 'white',
                        color: '#6366f1',
                        width: 32,
                        height: 32,
                        '&:hover': { bgcolor: '#f8fafc', transform: 'scale(1.1)' },
                        transition: 'all 0.2s ease-in-out',
                      }}
                      size="small"
                    >
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid item xs>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {userData.name || 'User'}
                    </Typography>
                    <Chip
                      label={(roleColors[userData.role] || roleColors.user).label}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 26,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="body1">{userData.email}</Typography>
                  </Box>
                  {userData.lastLogin && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PendingIcon fontSize="small" />
                      <Typography variant="body2">
                        Last login {formatTimeAgo(userData.lastLogin)}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <CalendarIcon fontSize="small" />
                    <Typography variant="body2">Member since {formatDate(userData.createdAt)}</Typography>
                    <Typography variant="body2" sx={{ mx: 1, opacity: 0.6 }}>|</Typography>
                    <BookIcon fontSize="small" />
                    <Typography variant="body2">{userStats.totalNotebooks} notebooks</Typography>
                    <Typography variant="body2" sx={{ mx: 1, opacity: 0.6 }}>|</Typography>
                    <GroupIcon fontSize="small" />
                    <Typography variant="body2">{userStats.totalCollaborators} invited collaborators</Typography>
                  </Box>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setActiveTab(0);
                      setIsEditing(true);
                    }}
                    sx={{
                      bgcolor: 'white',
                      color: '#6366f1',
                      fontWeight: 600,
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: '#f8fafc',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    Edit Profile
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 3,
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.3s ease-in-out',
                      ...getAnimationStyles(slideIn, 'normal', `${0.2 + index * 0.1}s`),
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 35px rgba(0,0,0,0.1)',
                        borderColor: stat.color,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: stat.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <stat.icon sx={{ fontSize: 28, color: stat.color }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: '#1f2937' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {stat.label}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Tabs */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                ...getAnimationStyles(fadeIn, 'normal', '0.8s'),
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: '#f8fafc',
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    minHeight: 60,
                    '&.Mui-selected': { color: '#6366f1' },
                  },
                  '& .MuiTabs-indicator': { backgroundColor: '#6366f1', height: 3 },
                }}
              >
                <Tab icon={<PersonIcon />} label="Profile Information" iconPosition="start" />
                <Tab icon={<LockIcon />} label="Security" iconPosition="start" />
                <Tab
                  icon={
                    <Badge
                      badgeContent={requestCounts.incoming.pending || null}
                      color="error"
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', minWidth: 18, height: 18 } }}
                    >
                      <PeopleIcon />
                    </Badge>
                  }
                  label="Collaborations"
                  iconPosition="start"
                />
                <Tab icon={<ShareIcon />} label="Shared" iconPosition="start" />
                <Tab icon={<AssessmentIcon />} label="Activity" iconPosition="start" />
              </Tabs>

              {/* Profile Information Tab */}
              <TabPanel value={activeTab} index={0}>
                <Box p={4}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: '#1f2937' }}>
                    Personal Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Role"
                        value={userData.role || 'User'}
                        disabled
                        variant="outlined"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Member Since"
                        value={formatDate(userData.createdAt)}
                        disabled
                        variant="outlined"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>

                  {isEditing && (
                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={loading}
                        sx={{
                          bgcolor: '#6366f1',
                          color: 'white',
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          '&:hover': { bgcolor: '#5855eb', transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(99,102,241,0.3)' },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({ ...formData, name: userData.name || '', email: userData.email || '' });
                        }}
                        sx={{
                          color: '#6b7280',
                          borderColor: '#d1d5db',
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          '&:hover': { bgcolor: '#f9fafb', borderColor: '#9ca3af' },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={activeTab} index={1}>
                <Box p={4}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: '#1f2937' }}>
                    Password & Security
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Keep your account secure by regularly updating your password.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<LockIcon />}
                    onClick={() => setShowPasswordDialog(true)}
                    sx={{
                      color: '#6366f1',
                      borderColor: '#6366f1',
                      fontWeight: 600,
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#f0f4ff', borderColor: '#5855eb', transform: 'translateY(-2px)' },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    Change Password
                  </Button>
                </Box>
              </TabPanel>

              {/* Collaboration Requests Tab */}
              <TabPanel value={activeTab} index={2}>
                <Box>
                  {/* Sub-tabs: Incoming / Outgoing */}
                  <Box
                    sx={{
                      px: 4,
                      pt: 3,
                      pb: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Tabs
                      value={requestTab}
                      onChange={(e, v) => setRequestTab(v)}
                      sx={{
                        '& .MuiTab-root': {
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          minHeight: 44,
                          '&.Mui-selected': { color: '#6366f1' },
                        },
                        '& .MuiTabs-indicator': { backgroundColor: '#6366f1', height: 2 },
                      }}
                    >
                      <Tab
                        icon={
                          <Badge
                            badgeContent={requestCounts.incoming.pending || null}
                            color="error"
                            sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16 } }}
                          >
                            <InboxIcon sx={{ fontSize: 20 }} />
                          </Badge>
                        }
                        label="Incoming"
                        iconPosition="start"
                        sx={{ gap: 1 }}
                      />
                      <Tab
                        icon={
                          <Badge
                            badgeContent={requestCounts.outgoing.pending || null}
                            color="primary"
                            sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16 } }}
                          >
                            <SendIcon sx={{ fontSize: 20 }} />
                          </Badge>
                        }
                        label="Outgoing"
                        iconPosition="start"
                        sx={{ gap: 1 }}
                      />
                    </Tabs>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ToggleButtonGroup
                        value={requestTab === 0 ? requestFilter : outgoingFilter}
                        exclusive
                        onChange={(e, v) => {
                          if (v !== null) {
                            if (requestTab === 0) setRequestFilter(v);
                            else setOutgoingFilter(v);
                          }
                        }}
                        size="small"
                        sx={{
                          '& .MuiToggleButton-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            px: 2,
                            py: 0.5,
                            borderColor: '#e5e7eb',
                            '&.Mui-selected': { bgcolor: '#f0f4ff', color: '#6366f1', borderColor: '#c7d2fe' },
                          },
                        }}
                      >
                        <ToggleButton value="pending">Pending</ToggleButton>
                        <ToggleButton value="accepted">Accepted</ToggleButton>
                        <ToggleButton value="declined">Declined</ToggleButton>
                        <ToggleButton value="all">All</ToggleButton>
                      </ToggleButtonGroup>

                      <Tooltip title="Refresh">
                        <IconButton
                          size="small"
                          onClick={() => (requestTab === 0 ? fetchIncomingRequests() : fetchOutgoingRequests())}
                          sx={{ color: '#6b7280' }}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Divider sx={{ mt: 2 }} />

                  {/* Request list */}
                  <Box sx={{ p: 4 }}>
                    {requestsLoading ? (
                      <Stack spacing={2}>
                        {[1, 2, 3].map((i) => (
                          <RequestSkeleton key={i} />
                        ))}
                      </Stack>
                    ) : requestTab === 0 ? (
                      incomingRequests.length === 0 ? (
                        <EmptyState
                          icon={InboxIcon}
                          title="No incoming requests"
                          description="When someone requests to collaborate on your notebooks, their requests will appear here."
                        />
                      ) : (
                        <Stack spacing={2}>
                          {incomingRequests.map((req) => (
                            <RequestCard
                              key={req.id}
                              request={req}
                              type="incoming"
                              onAccept={handleAcceptRequest}
                              onDecline={handleDeclineRequest}
                              processing={processingId}
                            />
                          ))}
                        </Stack>
                      )
                    ) : outgoingRequests.length === 0 ? (
                      <EmptyState
                        icon={SendIcon}
                        title="No outgoing requests"
                        description="Collaboration requests you send to other notebook owners will appear here."
                      />
                    ) : (
                      <Stack spacing={2}>
                        {outgoingRequests.map((req) => (
                          <RequestCard
                            key={req.id}
                            request={req}
                            type="outgoing"
                            onCancel={handleCancelRequest}
                            processing={processingId}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Box>
              </TabPanel>

              {/* Shared Notebooks Tab */}
              <TabPanel value={activeTab} index={3}>
                <Box p={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#1f2937' }}>
                      Shared with You
                    </Typography>
                    <Tooltip title="Refresh">
                      <IconButton
                        size="small"
                        onClick={fetchSharedNotebooks}
                        sx={{ color: '#6b7280' }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {sharedLoading ? (
                    <Stack spacing={2}>
                      {[1, 2, 3].map((i) => (
                        <Card key={i} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3 }}>
                          <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Skeleton variant="circular" width={44} height={44} />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton variant="text" width="60%" height={24} />
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Skeleton variant="rectangular" width={60} height={22} sx={{ borderRadius: 3 }} />
                                <Skeleton variant="text" width={100} height={20} />
                              </Box>
                            </Box>
                            <Skeleton variant="circular" width={36} height={36} />
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : sharedNotebooks.length === 0 ? (
                    <EmptyState
                      icon={ShareIcon}
                      title="No shared notebooks"
                      description="Notebooks shared with you by other users will appear here."
                    />
                  ) : (
                    <Stack spacing={2}>
                      {sharedNotebooks.map((notebook) => (
                        <SharedNotebookItem key={notebook._id} notebook={notebook} />
                      ))}
                    </Stack>
                  )}
                </Box>
              </TabPanel>

              {/* Activity Tab */}
              <TabPanel value={activeTab} index={4}>
                <Box p={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#1f2937' }}>
                      Recent Activity
                    </Typography>
                    <Tooltip title="Refresh">
                      <IconButton
                        size="small"
                        onClick={fetchActivity}
                        sx={{ color: '#6b7280' }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {activityLoading ? (
                    <Stack spacing={2}>
                      {[1, 2, 3].map((i) => (
                        <Card key={i} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3 }}>
                          <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Skeleton variant="circular" width={40} height={40} />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton variant="text" width="60%" height={24} />
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Skeleton variant="rectangular" width={60} height={22} sx={{ borderRadius: 3 }} />
                                <Skeleton variant="rectangular" width={80} height={22} sx={{ borderRadius: 3 }} />
                              </Box>
                            </Box>
                            <Skeleton variant="circular" width={32} height={32} />
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : activity.length === 0 ? (
                    <EmptyState
                      icon={HistoryIcon}
                      title="No activity yet"
                      description="Your recent notebook activity will appear here."
                    />
                  ) : (
                    <Stack spacing={2}>
                      {activity.map((item) => (
                        <ActivityItem key={item.id} activity={item} />
                      ))}
                    </Stack>
                  )}
                </Box>
              </TabPanel>
            </Paper>

            {/* Password Change Dialog */}
            <Dialog
              open={showPasswordDialog}
              onClose={() => setShowPasswordDialog(false)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  ...getAnimationStyles(bounceIn, 'normal', '0.3s'),
                },
              }}
            >
              <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#1f2937', pb: 1 }}>
                Change Password
              </DialogTitle>
              <Divider />
              <DialogContent sx={{ pt: 3 }}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                    },
                  }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
                  }}
                  sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handlePasswordChange}
                  disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                  sx={{
                    bgcolor: '#6366f1',
                    color: 'white',
                    fontWeight: 600,
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#5855eb' },
                    '&:disabled': { bgcolor: '#d1d5db' },
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Change Password'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
              open={snackbar.open}
              autoHideDuration={4000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                severity={snackbar.severity}
                sx={{ borderRadius: 2, fontWeight: 500 }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default ProfilePage;
