# Adding Framer Motion (Optional)

If you want to use Framer Motion for even more advanced animations, run:

```bash
cd Frontend
npm install framer-motion
```

Then you can replace the CSS animations in onboarding.tsx with Framer Motion components:

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Replace the step content div with:
<motion.div
  key={currentStep}
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
  {/* Step content */}
</motion.div>

// Wrap the entire form in AnimatePresence:
<AnimatePresence mode="wait">
  {/* Form content */}
</AnimatePresence>
```

However, the current implementation uses pure CSS animations which are:
- Faster performance
- No additional dependencies
- Better browser compatibility
- Smaller bundle size