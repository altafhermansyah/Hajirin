import React from 'react';
import AuthModal from './AuthModal';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin, onSuccess }) {
    return (
        <AuthModal
            isOpen={isOpen}
            onClose={onClose}
            initialView="register"
            onSuccess={onSuccess}
        />
    );
}
