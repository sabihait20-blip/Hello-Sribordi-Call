import { useEffect } from 'react';
import { updateUserPresence } from '../services/userService';

export function usePresence(userUid: string | null | undefined) {
  useEffect(() => {
    if (!userUid) return;

    // Set online on mount
    updateUserPresence(userUid, true);

    const handleFocus = () => updateUserPresence(userUid, true);
    const handleBlur = () => updateUserPresence(userUid, true); // keep online while active
    const handleUnload = () => updateUserPresence(userUid, false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleUnload);
      updateUserPresence(userUid, false);
    };
  }, [userUid]);
}
