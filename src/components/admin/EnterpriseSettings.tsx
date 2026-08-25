"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Key,
  Webhook,
  Palette,
  FileText,
  Check,
  X,
  Loader,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Download,
  AlertTriangle,
} from "lucide-react";

interface ApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  enabled: boolean;
  permissions: string[];
  rateLimitPerMin: number;
  lastUsedAt: string | null;
}

interface WebhookSummary {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
}

interface AuditLogSummary {
  id: string;
  createdAt: string;
  action: string;
  actorEmail?: string | null;
  severity: string;
  user?: { email: string } | null;
}

interface AuditStatsSummary {
  total: number;
  bySeverity?: Record<string, number>;
}

interface BrandingSettings {
  primaryColor?: string;
  logoUrl?: string;
  customDomain?: string;
  hideTechcittaBranding?: boolean;
  customFooterText?: string;
}

interface EnterpriseSettingsProps {
  token: string | null;
}

type Tab = "sso" | "api-keys" | "webhooks" | "branding" | "audit";

export default function EnterpriseSettings({ token }: EnterpriseSettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("sso");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "sso", label: "SSO Configuration", icon: Shield },
    { id: "api-keys", label: "API Keys", icon: Key },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "branding", label: "Custom Branding", icon: Palette },
    { id: "audit", label: "Audit Logs", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Enterprise Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure SSO, API access, webhooks, and custom branding for your
          organization.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === "sso" && (
          <SSOTab token={token} headers={headers} showToast={showToast} />
        )}
        {activeTab === "api-keys" && (
          <ApiKeysTab token={token} headers={headers} showToast={showToast} />
        )}
        {activeTab === "webhooks" && (
          <WebhooksTab token={token} headers={headers} showToast={showToast} />
        )}
        {activeTab === "branding" && (
          <BrandingTab token={token} headers={headers} showToast={showToast} />
        )}
        {activeTab === "audit" && (
          <AuditTab token={token} headers={headers} showToast={showToast} />
        )}
      </div>
    </div>
  );
}

// SSO Configuration Tab
function SSOTab({
  token,
  headers,
  showToast,
}: {
  token: string | null;
  headers: HeadersInit;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [config, setConfig] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    enabled: false,
    enforceSso: false,
    provider: "okta",
    providerName: "",
    samlMetadataUrl: "",
    samlEntityId: "",
    samlSsoUrl: "",
    samlSloUrl: "",
    samlCertificate: "",
    defaultRole: "member",
    emailAttribute: "email",
    nameAttribute: "name",
  });

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/enterprise/sso", { headers });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setFormData({
          enabled: data.enabled || false,
          enforceSso: data.enforceSso || false,
          provider: data.provider || "okta",
          providerName: data.providerName || "",
          samlMetadataUrl: data.samlMetadataUrl || "",
          samlEntityId: data.samlEntityId || "",
          samlSsoUrl: data.samlSsoUrl || "",
          samlSloUrl: data.samlSloUrl || "",
          samlCertificate: data.samlCertificate || "",
          defaultRole: data.defaultRole || "member",
          emailAttribute: data.emailAttribute || "email",
          nameAttribute: data.nameAttribute || "name",
        });
      }
    } catch {
      showToast("error", "Failed to load SSO configuration");
    } finally {
      setLoading(false);
    }
  }, [headers, showToast]);

  useEffect(() => {
    void Promise.resolve().then(fetchConfig);
  }, [fetchConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/enterprise/sso", {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showToast("success", "SSO configuration saved successfully");
      } else {
        showToast("error", "Failed to save SSO configuration");
      }
    } catch (error) {
      showToast("error", "Failed to save SSO configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Single Sign-On (SSO)
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure SAML or OIDC authentication for your organization
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Enable SSO</p>
            <p className="text-sm text-gray-500">
              Allow users to sign in with your identity provider
            </p>
          </div>
          <button
            onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.enabled ? "bg-indigo-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Enforce SSO</p>
            <p className="text-sm text-gray-500">
              Disable password login and require SSO for all users
            </p>
          </div>
          <button
            onClick={() => setFormData({ ...formData, enforceSso: !formData.enforceSso })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.enforceSso ? "bg-indigo-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.enforceSso ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Identity Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="okta">Okta</option>
              <option value="azure_ad">Microsoft Azure AD</option>
              <option value="onelogin">OneLogin</option>
              <option value="google_workspace">Google Workspace</option>
              <option value="custom_saml">Custom SAML Provider</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Role for SSO Users
            </label>
            <select
              value={formData.defaultRole}
              onChange={(e) => setFormData({ ...formData, defaultRole: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="member">Member</option>
              <option value="interviewer">Interviewer</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SAML Metadata URL
            </label>
            <input
              type="url"
              value={formData.samlMetadataUrl}
              onChange={(e) => setFormData({ ...formData, samlMetadataUrl: e.target.value })}
              placeholder="https://your-idp.com/metadata"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SSO Login URL
            </label>
            <input
              type="url"
              value={formData.samlSsoUrl}
              onChange={(e) => setFormData({ ...formData, samlSsoUrl: e.target.value })}
              placeholder="https://your-idp.com/sso/saml"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity ID
            </label>
            <input
              type="text"
              value={formData.samlEntityId}
              onChange={(e) => setFormData({ ...formData, samlEntityId: e.target.value })}
              placeholder="https://your-app.com/saml/metadata"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attribute Mapping - Email
            </label>
            <input
              type="text"
              value={formData.emailAttribute}
              onChange={(e) => setFormData({ ...formData, emailAttribute: e.target.value })}
              placeholder="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}

// API Keys Tab
function ApiKeysTab({
  token,
  headers,
  showToast,
}: {
  token: string | null;
  headers: HeadersInit;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState<{ name: string; key: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
    rateLimitPerMin: 60,
    rateLimitPerDay: 10000,
  });

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/enterprise/api-keys", { headers });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.apiKeys || []);
      }
    } catch {
      showToast("error", "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, [headers, showToast]);

  useEffect(() => {
    void Promise.resolve().then(fetchKeys);
  }, [fetchKeys]);

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/enterprise/api-keys", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.apiKey);
        showToast("success", "API key created successfully");
        fetchKeys();
      }
    } catch (error) {
      showToast("error", "Failed to create API key");
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    try {
      const res = await fetch(`/api/enterprise/api-keys?id=${keyId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        showToast("success", "API key deleted successfully");
        fetchKeys();
      }
    } catch (error) {
      showToast("error", "Failed to delete API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("success", "Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage API keys for programmatic access to your account
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </button>
      </div>

      {/* New Key Display */}
      {newKey && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-green-800">
              API Key Created Successfully
            </p>
            <button
              onClick={() => setNewKey(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-green-700 mb-2">
            Copy this key now - it won&apos;t be shown again:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-white border border-green-200 rounded text-sm font-mono">
              {newKey.key}
            </code>
            <button
              onClick={() => copyToClipboard(newKey.key)}
              className="p-2 text-green-600 hover:text-green-800"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* API Keys List */}
      {keys.length === 0 ? (
        <div className="text-center py-12">
          <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No API keys yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <div
              key={key.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{key.name}</p>
                  <p className="text-sm text-gray-500 font-mono">
                    {key.keyPrefix}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      key.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {key.enabled ? "Active" : "Disabled"}
                  </span>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span>{key.permissions.length} permissions</span>
                <span>{key.rateLimitPerMin} req/min</span>
                {key.lastUsedAt && (
                  <span>
                    Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Create API Key</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Production API"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formData.name}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Webhooks Tab (simplified)
function WebhooksTab({
  token,
  headers,
  showToast,
}: {
  token: string | null;
  headers: HeadersInit;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [webhooks, setWebhooks] = useState<WebhookSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/enterprise/webhooks", { headers });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch {
      showToast("error", "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, [headers, showToast]);

  useEffect(() => {
    void Promise.resolve().then(fetchWebhooks);
  }, [fetchWebhooks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Webhooks</h2>
        <p className="text-sm text-gray-500 mt-1">
          Receive real-time notifications for events in your account
        </p>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-12">
          <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No webhooks configured</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 truncate max-w-md">
                    {webhook.url}
                  </p>
                  <p className="text-sm text-gray-500">
                    {webhook.events.length} events
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    webhook.enabled
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {webhook.enabled ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Branding Tab (simplified)
function BrandingTab({
  token,
  headers,
  showToast,
}: {
  token: string | null;
  headers: HeadersInit;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBranding = useCallback(async () => {
    try {
      const res = await fetch("/api/enterprise/branding", { headers });
      if (res.ok) {
        const data = await res.json();
        setBranding(data.branding);
      }
    } catch {
      showToast("error", "Failed to load branding configuration");
    } finally {
      setLoading(false);
    }
  }, [headers, showToast]);

  useEffect(() => {
    void Promise.resolve().then(fetchBranding);
  }, [fetchBranding]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/enterprise/branding", {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      if (res.ok) {
        showToast("success", "Branding saved successfully");
      }
    } catch (error) {
      showToast("error", "Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Custom Branding</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize the look and feel of your account
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding?.primaryColor || "#4f46e5"}
                onChange={(e) =>
                  setBranding({ ...branding, primaryColor: e.target.value })
                }
                className="w-10 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={branding?.primaryColor || "#4f46e5"}
                onChange={(e) =>
                  setBranding({ ...branding, primaryColor: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              value={branding?.logoUrl || ""}
              onChange={(e) =>
                setBranding({ ...branding, logoUrl: e.target.value })
              }
              placeholder="https://your-logo.com/logo.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Domain
            </label>
            <input
              type="text"
              value={branding?.customDomain || ""}
              onChange={(e) =>
                setBranding({ ...branding, customDomain: e.target.value })
              }
              placeholder="careers.yourcompany.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">
                Hide Techcitta Branding
              </p>
              <p className="text-sm text-gray-500">
                Remove &quot;Powered by Techcitta&quot; from the interface
              </p>
            </div>
            <button
              onClick={() =>
                setBranding({
                  ...branding,
                  hideTechcittaBranding: !branding?.hideTechcittaBranding,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                branding?.hideTechcittaBranding ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  branding?.hideTechcittaBranding ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Footer Text
            </label>
            <input
              type="text"
              value={branding?.customFooterText || ""}
              onChange={(e) =>
                setBranding({ ...branding, customFooterText: e.target.value })
              }
              placeholder="© 2024 Your Company"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Branding"}
        </button>
      </div>
    </div>
  );
}

// Audit Logs Tab (simplified)
function AuditTab({
  token,
  headers,
  showToast,
}: {
  token: string | null;
  headers: HeadersInit;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [logs, setLogs] = useState<AuditLogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AuditStatsSummary | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch("/api/enterprise/audit?limit=50", { headers }),
        fetch("/api/enterprise/audit?action=stats", { headers }),
      ]);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch {
      showToast("error", "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [headers, showToast]);

  useEffect(() => {
    void Promise.resolve().then(fetchLogs);
  }, [fetchLogs]);

  const handleExport = async (format: "csv" | "json") => {
    try {
      const endDate = new Date();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const res = await fetch(
        `/api/enterprise/audit?action=export&format=${format}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs.${format}`;
        a.click();
        showToast("success", `Audit logs exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      showToast("error", "Failed to export audit logs");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Audit Logs</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track all activity in your organization for compliance
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport("json")}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Events</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {stats.bySeverity?.info || 0}
            </p>
            <p className="text-sm text-gray-500">Info Events</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">
              {stats.bySeverity?.warning || 0}
            </p>
            <p className="text-sm text-gray-500">Warnings</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {stats.bySeverity?.critical || 0}
            </p>
            <p className="text-sm text-gray-500">Critical</p>
          </div>
        </div>
      )}

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No audit logs yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Action
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Severity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {log.user?.email || log.actorEmail || "System"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        log.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : log.severity === "warning"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
