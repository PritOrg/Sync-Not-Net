// Animation utilities and configurations
import { keyframes } from '@mui/system';

// Keyframe animations
export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const bounceIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(-20px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) translateY(-5px);
  }
  70% {
    transform: scale(0.9) translateY(2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

export const shake = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-3px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(3px);
  }
`;

export const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  70% {
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
`;

export const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(99, 102, 241, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
  }
`;

export const slideInBottom = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

export const flipIn = keyframes`
  from {
    opacity: 0;
    transform: rotateY(-90deg);
  }
  to {
    opacity: 1;
    transform: rotateY(0);
  }
`;

// Animation configurations
export const animationConfig = {
  // Durations
  duration: {
    fast: '0.15s',
    normal: '0.3s',
    slow: '0.5s',
    verySlow: '0.8s',
  },
  
  // Easing functions
  easing: {
    easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Common transition styles
  transition: {
    all: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    transform: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    opacity: 'opacity 0.3s ease-in-out',
    colors: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out, border-color 0.3s ease-in-out',
    shadow: 'box-shadow 0.3s ease-in-out',
  },
};

// Animation utility functions
export const getAnimationStyles = (animationType, duration = 'normal', delay = '0s') => ({
  animation: `${animationType} ${animationConfig.duration[duration]} ${animationConfig.easing.easeOut} ${delay} both`,
});

export const getHoverTransform = (scale = 1.02, translateY = -2) => ({
  transition: animationConfig.transition.transform,
  '&:hover': {
    transform: `scale(${scale}) translateY(${translateY}px)`,
  },
});

export const getClickAnimation = () => ({
  transition: animationConfig.transition.transform,
  '&:active': {
    transform: 'scale(0.98)',
  },
});

export const getStaggeredDelay = (index, baseDelay = 0.1) => ({
  animationDelay: `${index * baseDelay}s`,
});

// Utility for creating smooth transitions
export const createTransition = (properties, duration = '0.3s', easing = 'ease-out') => 
  properties.map(prop => `${prop} ${duration} ${easing}`).join(', ');

export default {
  fadeIn,
  slideIn,
  slideInFromRight,
  bounceIn,
  shake,
  pulse,
  glow,
  slideInBottom,
  scaleIn,
  flipIn,
  animationConfig,
  getAnimationStyles,
  getHoverTransform,
  getClickAnimation,
  getStaggeredDelay,
  createTransition,
};
