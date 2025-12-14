import React from "react";
import { Badge } from "@/app/trainer/ui/badge";
import { Card } from "@/app/trainer/ui/card";
import { Clock, Flame, Trash2, Pencil } from "lucide-react";
import Link from "next/link";

interface VideoData {
    id: string;
    name: string;
    s3_url: string;
    thumbnail?: string;
    status: string;
    description?: string;
    duration?: string;
    calories?: number;
    level?: number;
    averageScore?: number;
    rejected?: boolean;
    approved?: boolean;
}

interface VideoCardProps {
    video: VideoData;
    onDelete?: (id: string) => void;
    readOnly?: boolean;
}

export default function VideoCard({ video, onDelete, readOnly = false }: VideoCardProps) {
    // Determine badge color based on status
    let badgeColor = "bg-gray-500";
    if (video.status === "Active") badgeColor = "bg-emerald-500";
    else if (video.status === "Rejected") badgeColor = "bg-red-500";
    else if (video.status === "Draft") badgeColor = "bg-gray-400";
    else if (video.status === "Verifying") badgeColor = "bg-yellow-500";

    return (
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-300 rounded-2xl relative block bg-white">
            {!readOnly && onDelete && (
                <div className="absolute top-2 left-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(video.id);
                        }}
                        className="p-2 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                        title="Delete Video"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <Link
                        href={`/uploadvideo?editId=${video.id}`}
                        className="p-2 bg-black/50 hover:bg-blue-600 text-white rounded-full transition-colors cursor-pointer flex items-center justify-center"
                        title="Edit Video"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Pencil className="h-4 w-4" />
                    </Link>
                </div>
            )}

            {/* Link to edit page if not readonly */}
            <Link href={readOnly ? "#" : `/uploadvideo?editId=${video.id}`} className="block h-full cursor-pointer">
                <div className="relative h-48 bg-white overflow-hidden flex items-center justify-center">
                    <video
                        src={video.s3_url}
                        className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-300"
                        muted
                        onMouseOver={(e: any) => e.currentTarget.play()}
                        onMouseOut={(e: any) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                        }}
                    />
                    <Badge className={`absolute top-3 right-3 border-0 shadow-lg px-3 py-1 rounded-full ${badgeColor} text-white`}>
                        {video.status}
                    </Badge>
                </div>
                <div className="p-5">
                    <h4 className="text-lg mb-3 truncate group-hover:text-violet-600 transition-colors font-semibold text-gray-900">
                        {video.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span>{video.duration || "00:00"}</span>
                        </div>
                        {video.calories !== undefined && (
                            <div className="flex items-center gap-1.5">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span>{video.calories} kcal</span>
                            </div>
                        )}
                        <Badge className="text-xs bg-gray-100 text-gray-800 border-gray-200">
                            Level {video.level || 1}
                        </Badge>
                    </div>
                </div>
            </Link>
        </Card>
    );
}
