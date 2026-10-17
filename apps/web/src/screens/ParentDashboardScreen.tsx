import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.js';
import {
  ArrowLeft,
  Award,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Sliders
} from 'lucide-react';
import type { ParentSummary, LearningLevel } from '@chatbot/shared';

interface ParentDashboardScreenProps {
  learnerId: string;
  onBack: () => void;
  onLevelChanged: (newLevel: LearningLevel) => void;
}

export const ParentDashboardScreen: React.FC<ParentDashboardScreenProps> = ({
  learnerId,
  onBack,
  onLevelChanged
}) => {
  const [summary, setSummary] = useState<ParentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.fetchParentSummary(learnerId);
      setSummary(data);
    } catch {
      // Failed to load
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [learnerId]);

  const handleManualLevelChange = async (targetLevel: LearningLevel) => {
    setIsUpdatingLevel(true);
    try {
      await apiClient.resetLearner(learnerId, targetLevel);
      onLevelChanged(targetLevel);
      await loadSummary();
    } catch {
      // Error
    } finally {
      setIsUpdatingLevel(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-slate-600 font-bold">Loading Learning Metrics...</div>
      </div>
    );
  }

  const { progressionStatus } = summary;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-indigo-100 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Child View</span>
        </button>

        <div className="text-right">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Parent & Educator Analytics</div>
          <div className="text-lg font-black text-slate-800">{summary.nickname}'s Learning Profile</div>
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-extrabold text-slate-500 uppercase">Current Level</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">Level {summary.currentLevel}</div>
          <div className="text-[11px] text-slate-500 font-medium">Ages {summary.currentLevel === 1 ? '3-4' : summary.currentLevel === 2 ? '4-5' : '5-6'}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-extrabold text-slate-500 uppercase">Questions Practiced</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{summary.totalQuestionsAnswered}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">{summary.totalStars} Stars Earned</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-extrabold text-slate-500 uppercase">Overall Accuracy</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{summary.overallAccuracy}%</div>
          <div className="text-[11px] text-slate-500 font-medium">Across all skills</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-extrabold text-slate-500 uppercase">Next Level Ready</div>
          <div className={`text-2xl font-black mt-1 ${progressionStatus.readyForNextLevel ? 'text-emerald-600' : 'text-amber-500'}`}>
            {progressionStatus.readyForNextLevel ? 'Yes! 🎉' : 'In Progress'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Target: Level {progressionStatus.targetLevel}</div>
        </div>
      </div>

      {/* Transparent Level Progression Criteria Box */}
      <div className="bg-white rounded-3xl p-6 border-2 border-indigo-200 shadow-md mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-6 h-6 text-indigo-600" />
          <h3 className="text-lg font-black text-slate-800">Transparent Level Progression Rules</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
          Advancement is explainable and reproducible. To graduate to Level {progressionStatus.targetLevel}, the child must demonstrate at least 80% accuracy over a minimum of {progressionStatus.minRequired} practice activities across at least {progressionStatus.minSessionsRequired} distinct sessions to eliminate lucky guesses.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Criteria Met</span>
            </div>
            {progressionStatus.criteriaMet.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-emerald-900 font-semibold">
                {progressionStatus.criteriaMet.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-emerald-700 italic">Starting baseline session</div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Criteria Remaining</span>
            </div>
            {progressionStatus.criteriaRemaining.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-amber-900 font-semibold">
                {progressionStatus.criteriaRemaining.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-emerald-700 font-bold">All advancement criteria met! Child is ready for promotion.</div>
            )}
          </div>
        </div>

        {/* Manual Override Controls for Parents/Teachers */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Manual Level Override:</span>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3].map(lvl => (
              <button
                key={lvl}
                type="button"
                disabled={isUpdatingLevel || summary.currentLevel === lvl}
                onClick={() => handleManualLevelChange(lvl as LearningLevel)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                  summary.currentLevel === lvl
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Set Level {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Mastery Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-black text-slate-800">Skill Breakdown & Mastery</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {summary.skillsBreakdown.map(skill => (
            <div key={skill.skillId} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-800">{skill.skillName}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    skill.status === 'mastered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : skill.status === 'needs_practice'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {skill.status.replace('_', ' ')}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${skill.masteryPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{skill.attempts} attempts ({skill.correct} correct)</span>
                <span className="font-bold">{skill.masteryPercent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pedagogical Recommendations */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-black text-slate-800">Pedagogical Recommendations</h3>
        </div>
        <ul className="space-y-2">
          {summary.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
              <span className="text-amber-500 font-bold">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
