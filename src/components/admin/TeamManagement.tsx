"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    color: "bg-[#a855f7]/10 text-[#a855f7]",
    bg: "bg-[#a855f7]/10",
    text: "text-[#a855f7]",
  },
  admin: {
    label: "Admin",
    color: "bg-[#3b82f6]/10 text-blue-800",
    bg: "bg-[#3b82f6]/10",
    text: "text-blue-800",
  },
  interviewer: {
    label: "Interviewer",
    color: "bg-[#22c55e]/10 text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
    text: "text-[#22c55e]",
  },
  member: {
    label: "Member",
    color: "bg-[#27272a] text-[#fafafa]",
    bg: "bg-[#27272a]",
    text: "text-[#fafafa]",
  },
  viewer: {
    label: "Viewer",
    color: "bg-[#64748b]/10 text-[#64748b]",
    bg: "bg-[#64748b]/10",
    text: "text-[#64748b]",
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

  const headers = useMemo(
    () => ({ "Content-Type": "application/json" }) as Record<string, string>,
    []
  );

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/team", { headers });
      if (!res.ok) throw new Error("Failed to load team members");
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : data.teamMembers ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load team members";
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  }, [headers, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(fetchMembers, 0);
    return () => window.clearTimeout(timer);
  }, [token, fetchMembers]);

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
        throw new Error(data?.error ?? "Failed to send invite");
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
              ? "bg-green-50 text-[#22c55e] border border-[#22c55e]/30"
              : "bg-red-50 text-[#ef4444] border border-[#ef4444]/30"
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
          <h1 className="text-2xl font-bold text-[#fafafa]">
            Team Management
          </h1>
          <p className="mt-1 text-sm text-[#a1a1aa]">
            Manage your team members, roles, and permissions.
          </p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#a78bfa] text-white text-sm font-medium rounded-lg hover:bg-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a78bfa] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Team Members Table */}
      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-6 h-6 text-[#a78bfa] animate-spin" />
              <span className="ml-3 text-sm text-[#a1a1aa]">
                Loading team members…
              </span>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mb-4">
                <UserPlus className="w-8 h-8 text-[#a1a1aa]" />
              </div>
              <h3 className="text-lg font-medium text-[#fafafa] mb-1">
                No team members yet
              </h3>
              <p className="text-sm text-[#a1a1aa] mb-6">
                Invite your first team member.
              </p>
              <button
                onClick={() => setInviteModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#a78bfa] text-white text-sm font-medium rounded-lg hover:bg-[#8b5cf6] transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#18181b]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa]">
                      Member
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa]">
                      Role
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa]">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa]">
                      Joined
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {members.map((member) => {
                    const roleConf = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
                    const status = getMemberStatus(member);
                    const isOwner = member.role === "owner";

                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-[#27272a] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-[#a78bfa] text-sm font-semibold flex-shrink-0">
                              {(member.name ?? member.email ?? "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#fafafa] truncate">
                                {member.name || "Pending"}
                              </p>
                              <p className="text-sm text-[#a1a1aa] truncate">
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f59e0b]/10 text-[#f59e0b]">
                              <Mail className="w-3 h-3" />
                              Invited
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#22c55e]">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#a1a1aa]">
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
                                className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#a1a1aa] hover:bg-[#27272a] transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === member.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-[#18181b] rounded-lg shadow-lg border border-[#27272a] py-1 z-10">
                                  <button
                                    onClick={() => openRoleModal(member)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#a1a1aa] hover:bg-[#27272a] transition-colors"
                                  >
                                    <Shield className="w-4 h-4 text-[#a1a1aa]" />
                                    Change Role
                                  </button>
                                  <button
                                    onClick={() => openRemoveModal(member)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[#a1a1aa] italic">
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
          <div className="relative bg-[#18181b] rounded-xl shadow-xl border border-[#27272a] w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
              <h2 className="text-lg font-semibold text-[#fafafa]">
                Invite Team Member
              </h2>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#a1a1aa] hover:bg-[#27272a] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3.5 py-2.5 border border-[#27272a] rounded-lg text-sm text-[#fafafa] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:border-[#a78bfa] transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#27272a] rounded-lg text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:border-[#a78bfa] transition-colors bg-[#18181b]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#27272a] bg-[#18181b]">
              <button
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#a1a1aa] bg-[#18181b] border border-[#27272a] rounded-lg hover:bg-[#27272a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#a78bfa] rounded-lg hover:bg-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <div className="relative bg-[#18181b] rounded-xl shadow-xl border border-[#27272a] w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
              <h2 className="text-lg font-semibold text-[#fafafa]">
                Change Role
              </h2>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#a1a1aa] hover:bg-[#27272a] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#18181b] rounded-lg">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-[#a78bfa] text-sm font-semibold">
                  {(selectedMember.name ?? selectedMember.email ?? "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#fafafa]">
                    {selectedMember.name || selectedMember.email}
                  </p>
                  <p className="text-xs text-[#a1a1aa]">
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
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#27272a] rounded-lg text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:border-[#a78bfa] transition-colors bg-[#18181b]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#27272a] bg-[#18181b]">
              <button
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#a1a1aa] bg-[#18181b] border border-[#27272a] rounded-lg hover:bg-[#27272a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeRole}
                disabled={savingRole || newRole === selectedMember.role}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#a78bfa] rounded-lg hover:bg-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <div className="relative bg-[#18181b] rounded-xl shadow-xl border border-[#27272a] w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5 text-center">
              <div className="w-12 h-12 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-[#ef4444]" />
              </div>
              <h2 className="text-lg font-semibold text-[#fafafa] mb-2">
                Remove Team Member
              </h2>
              <p className="text-sm text-[#a1a1aa]">
                Are you sure you want to remove{" "}
                <span className="font-medium text-[#fafafa]">
                  {selectedMember.name || selectedMember.email}
                </span>{" "}
                from the team? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-[#27272a] bg-[#18181b]">
              <button
                onClick={() => setRemoveModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#a1a1aa] bg-[#18181b] border border-[#27272a] rounded-lg hover:bg-[#27272a] transition-colors"
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
