import './bootstrap';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import AuthModal from './Components/Auth/AuthModal';

// Modal manager for standalone Blade views (like welcome.blade.php)
function AuthModalContainer() {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('login');

    useEffect(() => {
        // Expose global methods
        window.openAuthModal = (targetView = 'login') => {
            setView(targetView);
            setIsOpen(true);
        };
        window.openLoginModal = () => window.openAuthModal('login');
        window.openRegisterModal = () => window.openAuthModal('register');
        window.closeAuthModal = () => setIsOpen(false);

        // Click handler for data-auth-trigger elements
        const handleTriggerClick = (e) => {
            const trigger = e.target.closest('[data-auth-trigger]');
            if (trigger) {
                e.preventDefault();
                const triggerType = trigger.getAttribute('data-auth-trigger') || 'login';
                window.openAuthModal(triggerType);
            }
        };

        document.addEventListener('click', handleTriggerClick);
        return () => document.removeEventListener('click', handleTriggerClick);
    }, []);

    return (
        <AuthModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            initialView={view}
        />
    );
}

// Auto mount modal root on Blade pages
const modalRootElement = document.getElementById('auth-modal-root');
if (modalRootElement) {
    createRoot(modalRootElement).render(<AuthModalContainer />);
}

// Fallback: If no auth-modal-root element in HTML, automatically inject one
if (!modalRootElement && typeof document !== 'undefined') {
    const dynamicRoot = document.createElement('div');
    dynamicRoot.id = 'auth-modal-root';
    document.body.appendChild(dynamicRoot);
    createRoot(dynamicRoot).render(<AuthModalContainer />);
}

export { AuthModal, AuthModalContainer };
