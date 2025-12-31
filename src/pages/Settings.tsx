import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import './Pages.css';
import './Settings.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://zerosumserver.onrender.com';

interface UserSettings {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  hasRetailApiAccess: boolean;
  hasTradingAccess: boolean;
  deletionRequest: {
    requestedAt: string;
    reason: string | null;
    status: 'pending' | 'approved' | 'denied';
  } | null;
}

interface ApiKey {
  id: string;
  name: string;
  apiKeyId: string;
  secretLastFour: string;
  createdAt: string;
}

const Settings = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [showAddKeyForm, setShowAddKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKeyId, setNewApiKeyId] = useState('');
  const [newApiSecret, setNewApiSecret] = useState('');
  const [addingKey, setAddingKey] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [submittingDeletion, setSubmittingDeletion] = useState(false);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);
  const [enablingRetailApi, setEnablingRetailApi] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings?.hasRetailApiAccess) {
      fetchApiKeys();
    }
  }, [settings?.hasRetailApiAccess]);

  const fetchSettings = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/user/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    setApiKeysLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/user/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    } finally {
      setApiKeysLoading(false);
    }
  };

  const addApiKey = async () => {
    if (!newApiKeyId.trim() || !newApiSecret.trim()) {
      alert('Please enter both API Key ID and Secret');
      return;
    }

    setAddingKey(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/user/api-keys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName.trim() || 'Alpaca API Key',
          apiKeyId: newApiKeyId.trim(),
          apiSecret: newApiSecret.trim(),
        }),
      });
      if (response.ok) {
        // Clear form and close
        setNewKeyName('');
        setNewApiKeyId('');
        setNewApiSecret('');
        setShowAddKeyForm(false);
        fetchApiKeys();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to add API key');
      }
    } catch (err) {
      console.error('Failed to add API key:', err);
      alert('Failed to add API key');
    } finally {
      setAddingKey(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    setDeletingKeyId(keyId);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete API key');
      }
    } catch (err) {
      console.error('Failed to delete API key:', err);
      alert('Failed to delete API key');
    } finally {
      setDeletingKeyId(null);
    }
  };

  const requestDeletion = async () => {
    setSubmittingDeletion(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/user/request-deletion`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: deletionReason || null }),
      });
      if (response.ok) {
        setShowDeleteModal(false);
        setDeletionReason('');
        fetchSettings();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to submit deletion request');
      }
    } catch (err) {
      console.error('Failed to submit deletion request:', err);
      alert('Failed to submit deletion request');
    } finally {
      setSubmittingDeletion(false);
    }
  };

  const cancelDeletion = async () => {
    setCancellingDeletion(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/user/request-deletion`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchSettings();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to cancel deletion request');
      }
    } catch (err) {
      console.error('Failed to cancel deletion request:', err);
      alert('Failed to cancel deletion request');
    } finally {
      setCancellingDeletion(false);
    }
  };

  const enableRetailApiAccess = async () => {
    setEnablingRetailApi(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/user/enable-retail-api`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchSettings();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to enable retail API access');
      }
    } catch (err) {
      console.error('Failed to enable retail API access:', err);
      alert('Failed to enable retail API access');
    } finally {
      setEnablingRetailApi(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Settings</h1>
          <p className="page-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="page-subtitle">Manage your account settings and preferences</p>
      </div>

      {/* Account Information */}
      <div className="card settings-section">
        <h2>Account Information</h2>
        <div className="settings-grid">
          <div className="setting-item">
            <span className="setting-label">Email</span>
            <span className="setting-value">{settings?.email || user?.primaryEmailAddress?.emailAddress || '-'}</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Name</span>
            <span className="setting-value">
              {[settings?.firstName || user?.firstName, settings?.lastName || user?.lastName]
                .filter(Boolean)
                .join(' ') || '-'}
            </span>
          </div>
          <div className="setting-item">
            <span className="setting-label">User ID</span>
            <span className="setting-value mono">{settings?.id || user?.id || '-'}</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Trading Access</span>
            <span className={`setting-value ${settings?.hasTradingAccess ? 'positive' : ''}`}>
              {settings?.hasTradingAccess ? 'Enabled' : 'Not Enabled'}
            </span>
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      {!settings?.hasRetailApiAccess ? (
        <div className="card settings-section">
          <h2>Alpaca API Keys</h2>
          <p className="section-description">
            Enable retail API access to connect your personal Alpaca account for trading.
          </p>
          <button
            className="btn-primary"
            onClick={enableRetailApiAccess}
            disabled={enablingRetailApi}
          >
            {enablingRetailApi ? 'Enabling...' : 'Enable Retail API Access'}
          </button>
        </div>
      ) : (
        <div className="card settings-section">
          <div className="section-header">
            <h2>Alpaca API Keys</h2>
            {!showAddKeyForm && (
              <button
                className="btn-primary"
                onClick={() => setShowAddKeyForm(true)}
              >
                Add API Key
              </button>
            )}
          </div>
          <p className="section-description">
            Store your personal Alpaca retail API keys here for algorithmic trading.
            Get your API keys from your <a href="https://app.alpaca.markets/paper/dashboard/overview" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Alpaca Dashboard</a>.
          </p>

          {/* Add Key Form */}
          {showAddKeyForm && (
            <div className="add-key-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="apiKeyId">API Key ID</label>
                  <input
                    type="text"
                    id="apiKeyId"
                    className="input"
                    placeholder="PK..."
                    value={newApiKeyId}
                    onChange={(e) => setNewApiKeyId(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apiSecret">API Secret</label>
                  <input
                    type="password"
                    id="apiSecret"
                    className="input"
                    placeholder="Your API secret"
                    value={newApiSecret}
                    onChange={(e) => setNewApiSecret(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddKeyForm(false);
                    setNewKeyName('');
                    setNewApiKeyId('');
                    setNewApiSecret('');
                  }}
                  disabled={addingKey}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={addApiKey}
                  disabled={addingKey || !newApiKeyId.trim() || !newApiSecret.trim()}
                >
                  {addingKey ? 'Saving...' : 'Save API Key'}
                </button>
              </div>
            </div>
          )}

          {/* API Keys List */}
          {apiKeysLoading ? (
            <p className="loading-text">Loading API keys...</p>
          ) : apiKeys.length === 0 && !showAddKeyForm ? (
            <p className="empty-text">No API keys stored yet. Add your Alpaca API keys to get started.</p>
          ) : apiKeys.length > 0 && (
            <div className="api-keys-list">
              {apiKeys.map((key) => (
                <div key={key.id} className="api-key-item">
                  <div className="api-key-info">
                    <div className="api-key-name">{key.name}</div>
                    <code className="api-key-id">Key: {key.apiKeyId}</code>
                    <span className="api-key-meta">
                      Secret: ****{key.secretLastFour} • Added {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="api-key-actions">
                    <button
                      className="btn-danger-sm"
                      onClick={() => deleteApiKey(key.id)}
                      disabled={deletingKeyId === key.id}
                    >
                      {deletingKeyId === key.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      <div className="card settings-section danger-zone">
        <h2>Danger Zone</h2>

        {settings?.deletionRequest?.status === 'pending' ? (
          <div className="deletion-pending">
            <div className="pending-info">
              <span className="pending-icon">!</span>
              <div>
                <p className="pending-title">Account Deletion Requested</p>
                <p className="pending-details">
                  Requested on {new Date(settings.deletionRequest.requestedAt).toLocaleDateString()}.
                  Your request is being reviewed by our team.
                </p>
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={cancelDeletion}
              disabled={cancellingDeletion}
            >
              {cancellingDeletion ? 'Cancelling...' : 'Cancel Request'}
            </button>
          </div>
        ) : settings?.deletionRequest?.status === 'denied' ? (
          <div className="deletion-denied">
            <p>Your deletion request was denied. Please contact support for more information.</p>
          </div>
        ) : (
          <div className="danger-action">
            <div className="danger-info">
              <p className="danger-title">Delete Account</p>
              <p className="danger-description">
                Once you request account deletion, your account will be reviewed by our team.
                This action cannot be undone after approval.
              </p>
            </div>
            <button
              className="btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Request Account Deletion
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Request Account Deletion</h3>
            <p className="modal-description">
              Are you sure you want to request account deletion? This will submit a request
              to our team for review. Once approved, your account and all associated data
              will be permanently deleted.
            </p>
            <div className="form-group">
              <label htmlFor="reason">Reason for leaving (optional)</label>
              <textarea
                id="reason"
                className="input"
                placeholder="Let us know why you're leaving..."
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={submittingDeletion}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={requestDeletion}
                disabled={submittingDeletion}
              >
                {submittingDeletion ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
