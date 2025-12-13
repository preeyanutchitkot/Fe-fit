"use client";
import React, { useState } from 'react';
import { Input } from "@/app/trainer/ui/input";
import { Button } from "@/app/trainer/ui/button";
import { Plus } from "lucide-react";

interface InviteTraineeProps {
    onInvite?: (email: string) => void;
    onSuccess?: () => void;
    endpoint?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_BACKEND_URL || "/api/backend";

const InviteTrainee: React.FC<InviteTraineeProps> = ({
    onInvite,
    onSuccess,
    endpoint = `${API_BASE}/invite`
}) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            setStatus('Please sign in again (missing token).');
            return;
        }
        if (!email.trim()) {
            setStatus('Please enter an email.');
            return;
        }

        setSending(true);
        setStatus('Sending...');
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email }),
            });

            // สำเร็จ (200/201/204)
            if (res.ok) {
                setStatus('Trainee invitation sent!');
                onInvite?.(email.trim());
                onSuccess?.();
                setEmail('');
                return;
            }

            // กรณี BE ส่งข้อความมา
            const data = await res.json().catch(() => ({}));

            // เผื่อกรณีตั้งใจทำ idempotent: เป็น trainee อยู่แล้วแต่ถือว่าสำเร็จ
            if (res.status === 200 || data?.detail?.toLowerCase?.().includes('already')) {
                setStatus(data.detail || 'Already invited / mapping ensured');
                onSuccess?.();
            } else if (res.status === 401) {
                setStatus(`Unauthorized: ${data.detail || 'Please sign in again.'}`);
            } else {
                setStatus(`Failed: ${data.detail || 'Unknown error'}`);
            }
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 items-stretch w-full">
            <Input
                type="email"
                placeholder="Type an email to invite"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={sending}
                className="h-11 text-base border border-gray-200 bg-white rounded-lg shadow-none focus:ring-2 focus:ring-pink-200 w-full px-4"
            />
            <div className="flex flex-col gap-2">
                <Button
                    variant="default"
                    type="submit"
                    disabled={sending}
                    className="flex items-center justify-center h-11 w-full text-base font-semibold rounded-lg bg-gradient-to-r from-[#FF6A00] via-[#FF3CAC] to-[#784BA0] text-white shadow-none border-0 transition-all duration-200 hover:brightness-105 focus:ring-2 focus:ring-pink-200 disabled:opacity-80 disabled:cursor-not-allowed"
                >
                    {sending ? 'Sending…' : (
                        <>
                            <Plus className="h-5 w-5 mr-2" />
                            Invite
                        </>
                    )}
                </Button>
                {status && (
                    <span className={`text-sm text-center ${status.includes('Failed') || status.includes('Error') || status.includes('Unauthorized') ? 'text-red-500' : 'text-gray-500'}`}>
                        {status}
                    </span>
                )}
            </div>
        </form>
    );
}

export default InviteTrainee;
