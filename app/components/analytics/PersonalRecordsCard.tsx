"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/app/trainer/ui/card';
import { getPersonalRecords } from '@/api/trainer';
import { Medal } from 'lucide-react';

interface PersonalRecordsCardProps {
    autoFetch?: boolean;
    endpoint?: string;
    userId?: string;
}

export default function PersonalRecordsCard({ userId }: { userId?: string, autoFetch?: boolean, endpoint?: string }) {
    const [records, setRecords] = useState<{ name: string; value: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token || !userId) return;
                const res = await getPersonalRecords(token, userId);
                // Expecting array of records
                setRecords(Array.isArray(res) ? res : []);
            } catch (error) {
                console.error("Failed to fetch records", error);
            } finally {
                setLoading(false);
            }
        }
        if (userId) fetchData();
    }, [userId]);

    return (
        <Card className="p-5 bg-linear-to-br from-violet-600 to-indigo-700 text-white border-none shadow-lg shadow-indigo-200 rounded-2xl relative overflow-hidden">
            {/* Decorative bg */}
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3">
                <Medal size={120} />
            </div>

            <h3 className="text-white/80 font-medium mb-4 uppercase text-xs tracking-wider relative z-10">Personal Records</h3>

            <div className="space-y-3 relative z-10">
                {records.length > 0 ? records.map((rec, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/10 pb-2 last:border-0">
                        <span className="text-sm font-medium">{rec.name}</span>
                        <span className="font-bold text-lg">{rec.value}</span>
                    </div>
                )) : (
                    <div className="text-sm text-white/50 text-center py-4">No records yet</div>
                )}
            </div>
        </Card>
    );
}
