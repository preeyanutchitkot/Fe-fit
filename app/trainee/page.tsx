"use client";
import DashboardHeader from '../components/DashboardHeader';
import { Card } from '../trainer/ui/card';
import { Badge } from '../trainer/ui/badge';
import { Button } from '../trainer/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../trainer/ui/avatar';
import { Clock, Flame, Play, RotateCw, Star, TrendingUp, Zap, Trophy } from 'lucide-react';

// Dummy data for demonstration
const trainee = {
  name: "John Doe",
  profileImage: "/profile.jpg",
  isOnline: true,  
  dailyStreak: [
    { day: "Mon", date: "1", completed: true, isCurrent: false },
    { day: "Tue", date: "2", completed: true, isCurrent: false },
    { day: "Wed", date: "3", completed: false, isCurrent: true },
    { day: "Thu", date: "4", completed: false, isCurrent: false },
    { day: "Fri", date: "5", completed: false, isCurrent: false },
    { day: "Sat", date: "6", completed: false, isCurrent: false },
    { day: "Sun", date: "7", completed: false, isCurrent: false },
  ],
  weeklyFrequency: [3, 4, 2, 5, 1],
  stats: {
    currentStreak: 3,
    averageScore: 85,
    bestStreak: 7,
    totalWorkouts: 24,
    totalDuration: "12h 30m",
    progress: { completed: 8, total: 12 },
  },
  videos: [],
};

const trainerName = "Jane Smith";
const trainerImage = "/Logo_FitAddicttest.png";
const trainerMembersCount = 12;
const trainerVideosCount = 5;

export default function TraineeDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-orange-50">
      <DashboardHeader role="trainee" />
      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* ...existing dashboard content... */}
        {/* Example: Trainer Profile Card */}
        <div className="mb-10">
          <h2 className="text-4xl mb-2">My Dashboard</h2>
          <p className="text-gray-600 text-lg">Track your progress and workouts</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-l-4 border-l-violet-500 rounded-2xl shadow hover:shadow-lg transition-all duration-300">
                <h3 className="text-sm text-gray-600 mb-3">My Trainer</h3>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 relative ring-2 ring-white">
                      <AvatarImage src={trainerImage} alt={trainerName} />
                      <AvatarFallback>{trainerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 shadow-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">{trainerName}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{trainerMembersCount} Members</span>
                      <span>•</span>
                      <span>{trainerVideosCount} Videos</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Daily Streak */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-orange-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-orange-500" />
                  </div>
                  <h3 className="text-sm">Daily Streak</h3>
                </div>
                <div className="flex items-center justify-between gap-1">
                  {trainee.dailyStreak.map((day, index) => (
                    <div key={index} className="flex flex-col items-center gap-1.5">
                      <p className="text-xs text-gray-600">{day.day[0]}</p>
                      <div 
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          day.completed ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-200' : 
                          day.isCurrent ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-md' : 
                          'bg-gray-300 text-white'
                        }`}
                      >
                        <span className="text-xs">{day.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-violet-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-violet-600" />
                  </div>
                  <h3 className="text-sm">Quick Stats</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Flame className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Streak</p>
                        <p className="text-sm">{trainee.stats.currentStreak}d</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Star className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Avg Score</p>
                        <p className="text-sm">{trainee.stats.averageScore}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Progress</p>
                        <p className="text-sm">{trainee.stats.progress.completed}/{trainee.stats.progress.total}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="text-sm">{trainee.stats.totalDuration}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Workouts</p>
                        <p className="text-sm">{trainee.stats.totalWorkouts}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          {/* Right: Videos - Expanded */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl mb-2">My Workouts ({trainee.videos.length})</h3>
              <p className="text-gray-600">Your personalized workout videos</p>
            </div>

            {/* Next Video Card */}
            {/* Dummy nextVideo and video data for demonstration */}
            {(() => {
              const nextVideo = trainee.videos?.[0] || {
                id: 'v1',
                name: 'Plank',
                thumbnail: '/workout1.jpg',
                status: 'Try Again',
                duration: '30:20',
                calories: 20,
                score: 52,
                level: 1,
              };
              return (
                <Card className="mb-6 group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-300 hover:border-violet-200">
                  <div className="relative h-64 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800"
                      alt={nextVideo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Badge className={`absolute top-3 right-3 bg-orange-500 text-white border-0 shadow-lg px-3 py-1 rounded-full`}>
                      {nextVideo.status}
                    </Badge>
                  </div>
                  <div className="p-5">
                    <h4 className="text-lg mb-3 group-hover:text-violet-600 transition-colors">{nextVideo.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{nextVideo.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>{nextVideo.calories}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        My score: <strong className="text-gray-900">{nextVideo.score ? `${nextVideo.score}%` : '-'}</strong>
                      </div>
                    </div>
                    <Button 
                      className="w-full h-12 flex flex-row items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-base border-0 shadow-none hover:scale-[1.02]"
                    >
                      <Play className="h-5 w-5 fill-white" />
                      <span>Play</span>
                    </Button>
                  </div>
                </Card>
              );
            })()}

            {/* Level 1 Videos */}
            <div className="mb-6">
              <h4 className="mb-4">Level 1 (3)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Pushups */}
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-300 hover:border-violet-200">
                  <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800" alt="Pushups" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-0 shadow-lg px-3 py-1 rounded-full">Pass</Badge>
                  </div>
                  <div className="p-5">
                    <h5 className="mb-3 truncate group-hover:text-violet-600 transition-colors">Pushups</h5>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>30:20</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>20</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      My score: <strong className="text-gray-900">95%</strong>
                    </div>
                    <Button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium px-2 h-8 rounded w-full gap-2 bg-gray-400 text-white shadow-none border-0 hover:bg-gray-500">
                      <span className="inline-flex items-center justify-center gap-2 w-full rounded px-2 py-1 font-normal bg-gray-400 text-white text-base shadow-none border-0 hover:bg-gray-500">
                        <RotateCw className="h-5 w-5" />
                        Replay
                      </span>
                    </Button>
                  </div>
                </Card>
                {/* Plank */}
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-300 hover:border-violet-200">
                  <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800" alt="Plank" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Badge className="absolute top-3 right-3 bg-orange-500 text-white border-0 shadow-lg px-3 py-1 rounded-full">Try Again</Badge>
                  </div>
                  <div className="p-5">
                    <h5 className="mb-3 truncate group-hover:text-violet-600 transition-colors">Plank</h5>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>30:20</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>20</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      My score: <strong className="text-gray-900">52%</strong>
                    </div>
                    <Button className="w-full gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-base shadow-none border-0 hover:shadow-xl">
                      <span className="flex flex-row items-center justify-center gap-2 w-full h-8 bg-linear-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-base border-0 shadow-none">
                        <Play className="h-5 w-5 fill-white" />
                        Play
                      </span>
                    </Button>
                  </div>
                </Card>
                {/* Squats */}
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-300 hover:border-violet-200">
                  <div className="relative h-48 bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800" alt="Squats" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Badge className="absolute top-3 right-3 bg-gray-400 text-white border-0 shadow-lg px-3 py-1 rounded-full">Not Started</Badge>
                  </div>
                  <div className="p-5">
                    <h5 className="mb-3 truncate group-hover:text-violet-600 transition-colors">Squats</h5>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>30:20</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>20</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      My score: <strong className="text-gray-900">-</strong>
                    </div>
                    <Button className="w-full gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-base shadow-none border-0 hover:shadow-xl">
                      <span className="flex flex-row items-center justify-center gap-2 w-full h-8 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-base border-0 shadow-none">
                        <Play className="h-5 w-5 fill-white" />
                        Play
                      </span>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
            {/* Level 2 Videos */}
            <div className="mb-6">
              <h4 className="mb-4">Level 2 (2)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Deadlift */}
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-300 hover:border-violet-200">
                  <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800" alt="Deadlift" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Badge className="absolute top-3 right-3 bg-orange-500 text-white border-0 shadow-lg px-3 py-1 rounded-full">Try Again</Badge>
                  </div>
                  <div className="p-5">
                    <h5 className="mb-3 truncate group-hover:text-violet-600 transition-colors">Deadlift</h5>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>30:20</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>20</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      My score: <strong className="text-gray-900">-</strong>
                    </div>
                    <Button className="w-full gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-base shadow-none border-0 hover:shadow-xl">
                      <span className="flex flex-row items-center justify-center gap-2 w-full h-8 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-base border-0 shadow-none">
                        <Play className="h-5 w-5 fill-white" />
                        Play
                      </span>
                    </Button>
                  </div>
                </Card>
                {/* Pushup Advanced */}
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-300 hover:border-violet-200">
                  <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800" alt="Pushup Advanced" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-0 shadow-lg px-3 py-1 rounded-full">Pass</Badge>
                  </div>
                  <div className="p-5">
                    <h5 className="mb-3 truncate group-hover:text-violet-600 transition-colors">Pushup Advanced</h5>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>30:20</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>20</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      My score: <strong className="text-gray-900">95%</strong>
                    </div>
                    <Button className="w-full gap-2 bg-gray-400 text-white font-semibold text-base shadow-none border-0 hover:bg-gray-500">
                      <span className="inline-flex items-center justify-center gap-2 w-full rounded px-2 py-1 font-normal bg-gray-400 text-white text-base shadow-none border-0 hover:bg-gray-500">
                        <RotateCw className="h-5 w-5" />
                        Replay
                      </span>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}