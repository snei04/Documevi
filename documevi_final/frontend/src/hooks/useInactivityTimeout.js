import { useEffect, useRef, useCallback } from 'react';

/**
 * A custom React hook that executes a callback function after a specified period of user inactivity.
 * @param {function} onTimeout - The function to call when the user has been inactive.
 * @param {number} timeout - The inactivity duration in milliseconds (e.g., 1 hour = 3600000).
 */
export const useInactivityTimeout = (onTimeout, timeout) => {
    const timerRef = useRef(null);

    // FIX 1: Wrap resetTimer in useCallback
    // This ensures the function itself has a stable identity and doesn't get
    // recreated on every render unless its dependencies (onTimeout, timeout) change.
    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(onTimeout, timeout);
    }, [onTimeout, timeout]);

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];

        const handleActivity = () => {
            resetTimer();
        };

        // Initial call to start the timer when the component mounts
        resetTimer();

        // Add event listeners for all specified activity types
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup function: This runs when the component unmounts
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            // Remove all event listeners to prevent memory leaks
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    // FIX 2: Add the now-stable resetTimer to the dependency array
    // This satisfies the rules of hooks and prevents potential bugs.
    }, [resetTimer]);
};