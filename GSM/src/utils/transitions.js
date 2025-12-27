// Uniform transition configurations for consistent animations across all modules
export const transitions = {
  // Page entrance animations
  page: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Card entrance animations with staggered delays
  card: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Staggered card delays for grid layouts
  cardStagger: {
    delays: {
      0: 0.1,
      1: 0.2,
      2: 0.3,
      3: 0.4,
      4: 0.5,
      5: 0.6,
      6: 0.7,
      7: 0.8
    }
  },

  // Modal animations
  modal: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Modal backdrop
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },

  // List item animations
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Staggered list items
  listStagger: {
    container: {
    },
    item: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { duration: 0.2, ease: "easeOut" }
    }
  },

  // Button hover animations
  button: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 }
  },

  // Icon animations
  icon: {
    whileHover: { scale: 1.1, rotate: 5 },
    whileTap: { scale: 0.9 },
    transition: { duration: 0.2 }
  },

  // Fade animations
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },

  // Slide animations
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Scale animations
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Tab animations
  tab: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Notification animations
  notification: {
    initial: { opacity: 0, y: -50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -50, scale: 0.9 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Loading animations
  loading: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },

  // Table row animations
  tableRow: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Form field animations
  formField: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

// Helper function to get staggered delay for cards
export const getCardDelay = (index) => {
  return transitions.cardStagger.delays[index] || 0.1;
};

// Helper function to create staggered container
export const getStaggerContainer = (delay = 0.1) => ({
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      staggerChildren: delay
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      staggerChildren: delay,
      staggerDirection: -1
    }
  }
});

// Helper function to create staggered item
export const getStaggerItem = (baseTransition = transitions.card) => ({
  ...baseTransition,
  transition: {
    ...baseTransition.transition,
    delay: 0 // Will be overridden by staggerChildren
  }
});

// Common transition variants for reuse
export const variants = {
  // Page variants
  page: transitions.page,
  card: transitions.card,
  modal: transitions.modal,
  modalBackdrop: transitions.modalBackdrop,
  
  // Animation variants
  fade: transitions.fade,
  slideUp: transitions.slideUp,
  slideDown: transitions.slideDown,
  slideLeft: transitions.slideLeft,
  slideRight: transitions.slideRight,
  scale: transitions.scale,
  
  // Interactive variants
  button: transitions.button,
  icon: transitions.icon,
  
  // Content variants
  listItem: transitions.listItem,
  tableRow: transitions.tableRow,
  formField: transitions.formField,
  tab: transitions.tab,
  notification: transitions.notification,
  loading: transitions.loading
};

export default transitions;
