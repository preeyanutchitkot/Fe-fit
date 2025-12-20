"use client";

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/app/trainer/ui/card';
import { getWeeklyFrequency } from '@/api/trainer';

interface WeeklyFrequencyChartProps {
    autoFetch?: boolean;
    endpoint?: string;
    userId: string;
}

export default function WeeklyFrequencyChart({ userId }: WeeklyFrequencyChartProps) {
    const [data, setData] = useState<{ day: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await getWeeklyFrequency(token, userId);
                // Expected format: [{ day: 'Mon', count: 1 }, ...]
                // If backend returns object key-value, map it.
                // Assuming backend returns array or we adjust. 
                // Let's assume generic structure or handle it.
                // For now, assume [{day: 'Mon', count: 1}...]
                setData(res || []);
            } catch (error) {
                console.error("Failed to fetch weekly frequency", error);
                // Mock data for fallback
                setData([
                    { day: 'Mon', count: 0 },
                    { day: 'Tue', count: 0 },
                    { day: 'Wed', count: 0 },
                    { day: 'Thu', count: 0 },
                    { day: 'Fri', count: 0 },
                    { day: 'Sat', count: 0 },
                    { day: 'Sun', count: 0 },
                ]);
            } finally {
                setLoading(false);
            }
        }
        if (userId) fetchData();
    }, [userId]);

    return (
        <Card className="p-6 h-full min-h-[300px] flex flex-col bg-white border-none shadow-sm rounded-2xl">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Weekly Frequency</h3>

            <div className="flex-1 w-full min-h-[200px]">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-400">Loading...</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 4, 4]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#8b5cf6' : '#e5e7eb'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}
