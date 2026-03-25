/**
 * Update Prompt Component
 * Shows a modal when an app update is available
 */
import React from 'react';
import { useAppUpdate } from '../context/AppUpdateContext';

export function UpdatePrompt() {
  const { 
    updateAvailable, 
    isUpdating, 
    startImmediateUpdate,
    openAppStore 
  } = useAppUpdate();

  if (!updateAvailable) {
    return null;
  }

  const handleUpdate = async () => {
    try {
      await startImmediateUpdate();
    } catch (e) {
      // Fallback to opening Play Store
      await openAppStore();
    }
  };

  return (
    <div className="update-prompt-overlay">
      <div className="update-prompt-modal">
        <div className="update-prompt-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V16M12 16L8 12M12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3>Update Available</h3>
        <p>A new version of WhatToEat is available with improvements and bug fixes.</p>
        
        <button 
          className="update-prompt-button primary"
          onClick={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update Now'}
        </button>
        
        <button 
          className="update-prompt-button secondary"
          onClick={() => {/* User chose to skip - could hide for this session */}}
        >
          Later
        </button>
      </div>
    </div>
  );
}

// CSS styles (add to App.css or create separate file)
export const updatePromptStyles = `
.update-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.update-prompt-modal {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  max-width: 320px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.update-prompt-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
}

.update-prompt-modal h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.update-prompt-modal p {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.update-prompt-button {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  margin-bottom: 10px;
}

.update-prompt-button.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.update-prompt-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.update-prompt-button.primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.update-prompt-button.secondary {
  background: transparent;
  color: #666;
}

.update-prompt-button.secondary:hover {
  background: #f5f5f5;
}
`;

export default UpdatePrompt;
