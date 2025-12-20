"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/app/trainer/ui/card';
import { getCurrentStats } from '@/api/trainer';
import { Timer, Zap, Activity } from 'lucide-react';

interface CurrentStatsCardProps {
    autoFetch?: boolean;
    endpoint?: string;
    userId?: string; // Corrected from query param style
}

export default function CurrentStatsCard({ userId }: { userId?: string, autoFetch?: boolean, endpoint?: string }) {
    const [stats, setStats] = useState<any>({ duration: 0, calories: 0, workouts: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token || !userId) return;
                const res = await getCurrentStats(token, userId);
                setStats(res || { duration: 0, calories: 0, workouts: 0 });
            } catch (error) {
                console.error("Failed to fetch current stats", error);
            } finally {
                setLoading(false);
            }
        }
        if (userId) fetchData();
    }, [userId]);

    return (
        <Card className="p-5 bg-white border-none shadow-sm rounded-2xl">
            <h3 className="text-gray-500 font-medium mb-4 uppercase text-xs tracking-wider">Current Activity</h3>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Timer size={18} /></div>
                        <span className="text-sm font-medium text-gray-700">Duration</span>
                    </div>
                    <span className="font-bold text-gray-900">{stats.duration} min</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 text-pink-500 rounded-lg"><Zap size={18} /></div>
                        <span className="text-sm font-medium text-gray-700">Calories</span>
                    </div>
                    <span className="font-bold text-gray-900">{stats.calories} kcal</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><Activity size={18} /></div>
                        <span className="text-sm font-medium text-gray-700">Workouts</span>
                    </div>
                    <span className="font-bold text-gray-900">{stats.workouts}</span>
                </div>
            </div>
        </Card>
    );
}
