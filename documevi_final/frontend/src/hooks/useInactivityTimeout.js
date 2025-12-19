import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook personalizado que ejecuta un callback después de un período de inactividad del usuario.
 * Detecta actividad mediante eventos de mouse, teclado, touch y scroll.
 * Útil para implementar cierre de sesión automático por inactividad.
 * 
 * @param {Function} onTimeout - Función a ejecutar cuando el usuario ha estado inactivo
 * @param {number} timeout - Duración de inactividad en milisegundos (ej: 1 hora = 3600000)
 * 
 * @example
 * // Cerrar sesión después de 30 minutos de inactividad
 * useInactivityTimeout(() => {
 *     logout();
 *     navigate('/login');
 * }, 30 * 60 * 1000);
 */
export const useInactivityTimeout = (onTimeout, timeout) => {
    // Referencia al timer activo para poder cancelarlo
    const timerRef = useRef(null);

    /**
     * Reinicia el temporizador de inactividad.
     * Cancela el timer anterior (si existe) y crea uno nuevo.
     * Envuelto en useCallback para mantener identidad estable y evitar
     * recreaciones innecesarias en cada render.
     */
    const resetTimer = useCallback(() => {
        // Limpiar timer existente antes de crear uno nuevo
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        // Programar ejecución del callback después del tiempo de inactividad
        timerRef.current = setTimeout(onTimeout, timeout);
    }, [onTimeout, timeout]);

    useEffect(() => {
        // Eventos que indican actividad del usuario
        const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];

        /**
         * Handler que se ejecuta en cada evento de actividad.
         * Reinicia el contador de inactividad.
         */
        const handleActivity = () => {
            resetTimer();
        };

        // Iniciar el temporizador al montar el componente
        resetTimer();

        // Registrar listeners para todos los eventos de actividad
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // ============================================
        // CLEANUP: Limpieza al desmontar el componente
        // ============================================
        return () => {
            // Cancelar el timer pendiente
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            // Remover todos los event listeners para evitar memory leaks
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer]); // resetTimer es estable gracias a useCallback
};