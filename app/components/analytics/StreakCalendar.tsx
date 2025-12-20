"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/app/trainer/ui/card';
import { getStreak } from '@/api/trainer';
import { Flame } from 'lucide-react';

interface StreakCalendarProps {
    autoFetch?: boolean;
    endpoint?: string;
    userId: string;
}

export default function StreakCalendar({ userId }: StreakCalendarProps) {
    const [streakData, setStreakData] = useState<{ date: string; completed: boolean }[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await getStreak(token, userId);
                // Expected: { currentStreak: 5, history: [{date: '2023-01-01', completed: true}, ...] }
                setStreakData(res.history || []);
                setCurrentStreak(res.currentStreak || 0);
            } catch (error) {
                console.error("Failed to fetch streak", error);
                // Mock
                setStreakData([]);
                setCurrentStreak(0);
            } finally {
                setLoading(false);
            }
        }
        if (userId) fetchData();
    }, [userId]);

    // Generate last 14 days for visualization if history is sparse
    const days = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i)); // Past 14 days
        return d.toISOString().split('T')[0];
    });

    return (
        <Card className="p-6 h-full bg-white border-none shadow-sm rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Daily Streak</h3>
                <div className="flex items-center gap-1.5 text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                    <Flame size={16} fill="currentColor" />
                    <span className="font-bold">{currentStreak} Day{currentStreak !== 1 ? 's' : ''}</span>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {/* Simple week view: showing last 14 days as simple squares */}
                {days.map((dayIso) => {
                    const isCompleted = streakData.find(d => d.date === dayIso && d.completed);
                    const isToday = dayIso === new Date().toISOString().split('T')[0];

                    return (
                        <div key={dayIso} className="flex flex-col items-center gap-1">
                            <div
                                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${isCompleted ? 'bg-orange-500 text-white' :
                                    isToday ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-400'
                                    }`}
                                title={dayIso}
                            >
                                {dayIso.slice(8)} {/* Day of month */}
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    );
}
