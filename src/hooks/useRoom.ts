'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoomMember {
  id: string;
  userId: string;
  roomId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
    phone?: string | null;
    creditScore: number;
  };
}

export interface Room {
  id: string;
  name: string;
  code: string;
  maxMembers: number;
  isLocked: boolean;
  createdAt: string;
  members: RoomMember[];
  _count?: { members: number; expenses: number };
}

export interface CreateRoomInput {
  name: string;
}

export interface JoinRoomInput {
  code: string;
}

export interface UseRoomReturn {
  room: Room | null;
  rooms: Room[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createRoom: (input: CreateRoomInput) => Promise<Room>;
  joinRoom: (input: JoinRoomInput) => Promise<Room>;
  leaveRoom: (roomId: string) => Promise<void>;
  removeMember: (roomId: string, userId: string) => Promise<void>;
  transferOwnership: (roomId: string, newOwnerId: string) => Promise<void>;
  updateRoomSettings: (roomId: string, data: { name?: string; maxMembers?: number; isLocked?: boolean }) => Promise<Room>;
  deleteRoom: (roomId: string) => Promise<void>;
  regenerateInviteCode: (roomId: string) => Promise<{ inviteCode: string; expiresAt: string; roomCode: string }>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRoom(): UseRoomReturn {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch all rooms the current user belongs to. */
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/rooms');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch rooms (${res.status})`);
      }

      const data = await res.json();
      // API returns { room: {...} | null, role: '...' } for a single room
      // or could return { rooms: [...] } if multi-room is supported
      if (Array.isArray(data)) {
        setRooms(data);
      } else if (data.rooms) {
        setRooms(data.rooms);
      } else if (data.room) {
        setRooms([data.room]);
      } else {
        setRooms([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rooms';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  /** Create a new room and auto-refetch. */
  const createRoom = useCallback(
    async (input: CreateRoomInput): Promise<Room> => {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create room');
      }

      const room: Room = await res.json();
      await fetchRooms(); // refresh list
      return room;
    },
    [fetchRooms]
  );

  /** Join an existing room by invite code. */
  const joinRoom = useCallback(
    async (input: JoinRoomInput): Promise<Room> => {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to join room');
      }

      const room: Room = await res.json();
      await fetchRooms();
      return room;
    },
    [fetchRooms]
  );

  /** Leave a room. */
  const leaveRoom = useCallback(
    async (roomId: string): Promise<void> => {
      const res = await fetch(`/api/rooms/${roomId}/leave`, {
        method: 'POST',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to leave room');
      }

      await fetchRooms();
    },
    [fetchRooms]
  );

  /** Remove a member (Owner/Admin only). */
  const removeMember = useCallback(
    async (roomId: string, userId: string): Promise<void> => {
      const res = await fetch(`/api/rooms/${roomId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to remove member');
      }

      await fetchRooms();
    },
    [fetchRooms]
  );

  /** Transfer room ownership (Owner only). */
  const transferOwnership = useCallback(
    async (roomId: string, newOwnerId: string): Promise<void> => {
      const res = await fetch(`/api/rooms/${roomId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to transfer ownership');
      }

      await fetchRooms();
    },
    [fetchRooms]
  );

  /** Update room settings (Owner only). */
  const updateRoomSettings = useCallback(
    async (roomId: string, data: { name?: string; maxMembers?: number; isLocked?: boolean }): Promise<Room> => {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update room settings');
      }

      const updated = await res.json();
      await fetchRooms();
      return updated.room;
    },
    [fetchRooms]
  );

  /** Delete room (Owner only). */
  const deleteRoom = useCallback(
    async (roomId: string): Promise<void> => {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete room');
      }

      await fetchRooms();
    },
    [fetchRooms]
  );

  /** Regenerate invite code (Owner/Admin only). */
  const regenerateInviteCode = useCallback(
    async (roomId: string): Promise<{ inviteCode: string; expiresAt: string; roomCode: string }> => {
      const res = await fetch(`/api/rooms/${roomId}/invite`, {
        method: 'POST',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to generate invite code');
      }

      return res.json();
    },
    []
  );

  // Expose the first room as `room` for convenience (most users have one).
  const activeRoom = rooms.length > 0 ? rooms[0] : null;

  return {
    room: activeRoom,
    rooms,
    loading,
    error,
    refetch: fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    removeMember,
    transferOwnership,
    updateRoomSettings,
    deleteRoom,
    regenerateInviteCode,
  };
}

export default useRoom;
