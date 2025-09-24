'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Target,
  Bug,
  Star,
  Clock,
  TrendingUp,
  Crown,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  BarChart3,
  Gift,
  ChevronRight,
  Plus,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import toast from 'react-hot-toast';

interface UserBugStats {
  total_bugs: number;
  open_bugs: number;
  resolved_bugs: number;
  critical_bugs: number;
  high_bugs: number;
  medium_bugs: number;
  low_bugs: number;
  points: number;
  rank: number;
  level: string;
  level_progress: number;
  next_level_points: number;
  badges: string[];
  streak_days: number;
  categories: {
    ui_ux: number;
    functionality: number;
    performance: number;
    security: number;
    other: number;
  };
  recent_reports: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    created_at: string;
    points_earned: number;
  }>;
}

interface BugBountyTrackerProps {
  userId: string;
  userEmail: string;
  className?: string;
  onReportBug?: () => void;
}

const BugBountyTracker: React.FC<BugBountyTrackerProps> = ({
  userId,
  userEmail,
  className = '',
  onReportBug
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserBugStats>({
    total_bugs: 0,
    open_bugs: 0,
    resolved_bugs: 0,
    critical_bugs: 0,
    high_bugs: 0,
    medium_bugs: 0,
    low_bugs: 0,
    points: 0,
    rank: 0,
    level: 'Beginner',
    level_progress: 0,
    next_level_points: 50,
    badges: [],
    streak_days: 0,
    categories: {
      ui_ux: 0,
      functionality: 0,
      performance: 0,
      security: 0,
      other: 0
    },
    recent_reports: []
  });

  const [showAllReports, setShowAllReports] = useState(false);

  useEffect(() => {
    if (userId && userEmail) {
      loadUserStats();
    }
  }, [userId, userEmail]);

  const loadUserStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bug-bounty/user-stats?userId=${userId}&email=${userEmail}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('Failed to load user stats:', data.error);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHunterLevel = (points: number): { level: string; color: string; icon: any; minPoints: number; maxPoints: number } => {
    if (points >= 1000) return { level: 'Legend', color: 'bg-purple-500', icon: Crown, minPoints: 1000, maxPoints: 9999 };
    if (points >= 500) return { level: 'Expert', color: 'bg-yellow-500', icon: Trophy, minPoints: 500, maxPoints: 999 };
    if (points >= 200) return { level: 'Advanced', color: 'bg-blue-500', icon: Award, minPoints: 200, maxPoints: 499 };
    if (points >= 50) return { level: 'Intermediate', color: 'bg-green-500', icon: Medal, minPoints: 50, maxPoints: 199 };
    return { level: 'Beginner', color: 'bg-gray-500', icon: Target, minPoints: 0, maxPoints: 49 };
  };

  const calculateLevelProgress = (points: number): number => {
    const level = getHunterLevel(points);
    if (level.level === 'Legend') return 100;
    
    const progress = ((points - level.minPoints) / (level.maxPoints - level.minPoints)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getNextLevelPoints = (points: number): number => {
    const level = getHunterLevel(points);
    if (level.level === 'Legend') return 0;
    return level.maxPoints + 1 - points;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'resolved': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const currentLevel = getHunterLevel(stats.points);
  const levelProgress = calculateLevelProgress(stats.points);
  const nextLevelPoints = getNextLevelPoints(stats.points);
  const LevelIcon = currentLevel.icon;

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading your bug hunting stats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span>Bug Hunter Dashboard</span>
          </h2>
          <p className="text-gray-600 mt-1">Track your progress in our bug bounty program</p>
        </div>
        {onReportBug && (
          <Button onClick={onReportBug} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Report Bug</span>
          </Button>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Level & Progress Card */}
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full ${currentLevel.color}`}>
                  <LevelIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{currentLevel.level} Hunter</h3>
                  <p className="text-sm text-gray-600">{stats.points} points</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Rank</p>
                <p className="text-2xl font-bold text-gray-900">#{stats.rank || '-'}</p>
              </div>
            </div>

            {currentLevel.level !== 'Legend' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress to {getHunterLevel(currentLevel.maxPoints + 1).level}</span>
                  <span className="text-gray-600">{nextLevelPoints} points to go</span>
                </div>
                <Progress value={levelProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Reports</span>
                <span className="text-2xl font-bold text-gray-900">{stats.total_bugs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Resolved</span>
                <span className="text-lg font-semibold text-green-600">{stats.resolved_bugs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Streak</span>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-lg font-semibold text-gray-900">{stats.streak_days} days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bug Reports by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.critical_bugs}</p>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-xs text-gray-500">{stats.critical_bugs * 50} pts</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.high_bugs}</p>
              <p className="text-sm text-gray-600">High</p>
              <p className="text-xs text-gray-500">{stats.high_bugs * 30} pts</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.medium_bugs}</p>
              <p className="text-sm text-gray-600">Medium</p>
              <p className="text-xs text-gray-500">{stats.medium_bugs * 15} pts</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.low_bugs}</p>
              <p className="text-sm text-gray-600">Low</p>
              <p className="text-xs text-gray-500">{stats.low_bugs * 5} pts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Bug Reports</CardTitle>
            {stats.recent_reports.length > 3 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAllReports(!showAllReports)}
              >
                {showAllReports ? 'Show Less' : 'Show All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {stats.recent_reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bug className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No bug reports yet</p>
              <p className="text-sm">Start hunting bugs to see your progress!</p>
              {onReportBug && (
                <Button onClick={onReportBug} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Report Your First Bug
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {(showAllReports ? stats.recent_reports : stats.recent_reports.slice(0, 3)).map((report) => (
                <motion.div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{report.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={`${getPriorityColor(report.priority)} text-white text-xs`}>
                        {report.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(report.status)} text-white text-xs`}>
                        {report.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold text-green-600">+{report.points_earned} pts</p>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      {stats.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.badges.map((badge, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-full px-3 py-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">{badge}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BugBountyTracker;

