import React from 'react';
import AuthModal from './AuthModal';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister, onSuccess }) {
    return (
        <AuthModal
            isOpen={isOpen}
            onClose={onClose}
            initialView="login"
            onSuccess={onSuccess}
        />
    );
}
