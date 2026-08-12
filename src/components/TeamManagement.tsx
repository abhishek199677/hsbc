"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, ChevronDown, Trash2, X, Shield, Mail, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  invitedAt: string;
  acceptedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    createdAt: string;
  };
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner: { label: "Owner", color: "bg-purple-100 text-purple-700" },
  admin: { label: "Admin", color: "bg-blue-100 text-blue-700" },
  interviewer: { label: "Interviewer", color: "bg-green-100 text-green-700" },
  member: { label: "Member", color: "bg-gray-100 text-gray-700" },
  viewer: { label: "Viewer", color: "bg-yellow-100 text-yellow-700" },
};

export default function TeamManagement() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      try {
        const res = await fetch("/api/admin/team", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!cancelled && data.success) setTeamMembers(data.teamMembers);
      } catch (err) {
        console.error("Failed to load team members:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, router]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !token) return;
    setInviting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (data.success) {
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteRole("member");
        fetchTeamMembers();
      } else {
        setError(data.error || "Failed to invite member");
      }
    } catch {
      setError("Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (teamMemberId: string, newRole: string) => {
    if (!token) return;
    setUpdatingRole(teamMemberId);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamMemberId, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTeamMembers();
      } else {
        setError(data.error || "Failed to update role");
      }
    } catch {
      setError("Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemove = async (teamMemberId: string) => {
    if (!token) return;
    setRemovingId(teamMemberId);
    try {
      const res = await fetch(`/api/admin/team?id=${teamMemberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setShowConfirmRemove(null);
        fetchTeamMembers();
      } else {
        setError(data.error || "Failed to remove member");
      }
    } catch {
      setError("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teamMembers.map((member) => {
              const isCurrentUser = member.userId === user?.id;
              const isOwner = member.role === "owner";
              const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.member;

              return (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-700">
                          {member.user.name?.charAt(0)?.toUpperCase() || member.user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.user.name || "N/A"}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isOwner || isCurrentUser ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    ) : (
                      <div className="relative">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          disabled={updatingRole === member.id}
                          className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="interviewer">Interviewer</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {member.acceptedAt ? (
                      <span className="flex items-center gap-1.5 text-sm text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-yellow-600">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(member.acceptedAt || member.invitedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {!isOwner && !isCurrentUser && (
                      <>
                        {showConfirmRemove === member.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Remove?</span>
                            <button
                              onClick={() => handleRemove(member.id)}
                              disabled={removingId === member.id}
                              className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                            >
                              {removingId === member.id ? "..." : "Yes"}
                            </button>
                            <button
                              onClick={() => setShowConfirmRemove(null)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowConfirmRemove(member.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {teamMembers.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No team members yet. Invite someone to get started.</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="interviewer">Interviewer</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {inviting ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
