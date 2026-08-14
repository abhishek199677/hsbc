"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UserPlus,
  MoreVertical,
  Trash2,
  Shield,
  Mail,
  Check,
  X,
  Loader,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "interviewer" | "member" | "viewer";
  status: "active" | "invited";
  joinedAt: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
}

interface TeamManagementProps {
  token: string | null;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; text: string }
> = {
  owner: {
    label: "Owner",
    color: "bg-purple-100 text-purple-800",
    bg: "bg-purple-100",
    text: "text-purple-800",
  },
  admin: {
    label: "Admin",
    color: "bg-blue-100 text-blue-800",
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  interviewer: {
    label: "Interviewer",
    color: "bg-green-100 text-green-800",
    bg: "bg-green-100",
    text: "text-green-800",
  },
  member: {
    label: "Member",
    color: "bg-gray-100 text-gray-800",
    bg: "bg-gray-100",
    text: "text-gray-800",
  },
  viewer: {
    label: "Viewer",
    color: "bg-slate-100 text-slate-800",
    bg: "bg-slate-100",
    text: "text-slate-800",
  },
};

const ROLES = ["admin", "interviewer", "member", "viewer"] as const;

export default function TeamManagement({ token }: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [newRole, setNewRole] = useState<string>("");
  const [inviting, setInviting] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/team", { headers });
      if (!res.ok) throw new Error("Failed to load team members");
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : data.members ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load team members";
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      showToast("error", "Email is required");
      return;
    }
    try {
      setInviting(true);
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "Failed to send invite");
      }
      showToast("success", "Invitation sent successfully");
      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      fetchMembers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send invite";
      showToast("error", message);
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedMember || !newRole) return;
    try {
      setSavingRole(true);
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedMember.id, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "Failed to update role");
      }
      showToast("success", "Role updated successfully");
      setRoleModalOpen(false);
      setSelectedMember(null);
      setNewRole("");
      fetchMembers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update role";
      showToast("error", message);
    } finally {
      setSavingRole(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedMember) return;
    try {
      setRemoving(true);
      const res = await fetch(`/api/admin/team?id=${selectedMember.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "Failed to remove member");
      }
      showToast("success", "Member removed successfully");
      setRemoveModalOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to remove member";
      showToast("error", message);
    } finally {
      setRemoving(false);
    }
  };

  const openRoleModal = (member: TeamMember) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setRoleModalOpen(true);
    setOpenMenuId(null);
  };

  const openRemoveModal = (member: TeamMember) => {
    setSelectedMember(member);
    setRemoveModalOpen(true);
    setOpenMenuId(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMemberStatus = (m: TeamMember) => {
    if (m.acceptedAt) return "active";
    if (m.invitedAt) return "invited";
    return "active";
  };

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Team Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your team members, roles, and permissions.
          </p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
              <span className="ml-3 text-sm text-gray-500">
                Loading team members…
              </span>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No team members yet
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Invite your first team member.
              </p>
              <button
                onClick={() => setInviteModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => {
                    const roleConf = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
                    const status = getMemberStatus(member);
                    const isOwner = member.role === "owner";

                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold flex-shrink-0">
                              {(member.name ?? member.email ?? "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {member.name || "Pending"}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConf.color}`}
                          >
                            {roleConf.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {status === "invited" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <Mail className="w-3 h-3" />
                              Invited
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(member.joinedAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isOwner ? (
                            <div className="relative inline-block" ref={openMenuId === member.id ? menuRef : undefined}>
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === member.id ? null : member.id,
                                  )
                                }
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === member.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                  <button
                                    onClick={() => openRoleModal(member)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Shield className="w-4 h-4 text-gray-400" />
                                    Change Role
                                  </button>
                                  <button
                                    onClick={() => openRemoveModal(member)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Owner
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setInviteModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Invite Team Member
              </h2>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {inviting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {inviting ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setRoleModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Change Role
              </h2>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold">
                  {(selectedMember.name ?? selectedMember.email ?? "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedMember.name || selectedMember.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Current role:{" "}
                    <span
                      className={`font-medium ${ROLE_CONFIG[selectedMember.role]?.text ?? ""}`}
                    >
                      {ROLE_CONFIG[selectedMember.role]?.label ?? selectedMember.role}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeRole}
                disabled={savingRole || newRole === selectedMember.role}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingRole ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {savingRole ? "Saving…" : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {removeModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setRemoveModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Remove Team Member
              </h2>
              <p className="text-sm text-gray-500">
                Are you sure you want to remove{" "}
                <span className="font-medium text-gray-900">
                  {selectedMember.name || selectedMember.email}
                </span>{" "}
                from the team? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setRemoveModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {removing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {removing ? "Removing…" : "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
