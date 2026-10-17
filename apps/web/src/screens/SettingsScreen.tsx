import React, { useState } from 'react';
import { apiClient } from '../api/client.js';
import { speechService } from '../utils/audio.js';
import {
  ArrowLeft,
  ShieldCheck,
  Trash2,
  RotateCcw,
  Volume2,
  CheckCircle2
} from 'lucide-react';
import type { Learner } from '@chatbot/shared';

interface SettingsScreenProps {
  learner: Learner;
  onBack: () => void;
  onResetProgress: () => void;
  onDataDeleted: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  learner,
  onBack,
  onResetProgress,
  onDataDeleted
}) => {
  const [speechSpeed, setSpeechSpeed] = useState(0.88);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSpeedChange = (speed: number) => {
    setSpeechSpeed(speed);
    speechService.setSpeechRate(speed);
    speechService.speak("This is Pip's new reading speed.");
  };

  const handleResetProgress = async () => {
    if (window.confirm("Are you sure you want to reset all stars and skills to a fresh start?")) {
      try {
        await apiClient.resetLearner(learner.id, 1);
        setResetSuccess(true);
        setTimeout(() => {
          onResetProgress();
        }, 1200);
      } catch {
        alert("Failed to reset progress.");
      }
    }
  };

  const handleDeleteData = async () => {
    try {
      await apiClient.deleteLearnerData(learner.id);
      alert("All learner records, attempts, and history have been permanently deleted.");
      onDataDeleted();
    } catch {
      alert("Failed to delete learner data.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <h2 className="text-lg font-black text-slate-800">Settings & Child Privacy</h2>
      </div>

      <div className="space-y-6">
        {/* Audio & Cadence Settings */}
        <div className="card-pastel p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-800">Voice Cadence (Child Accessibility)</h3>
          </div>
          <p className="text-xs text-slate-600 mb-4 font-medium">
            Children under 7 comprehend best with slightly slower, clearly articulated pronunciation.
          </p>

          <div className="flex gap-2">
            {[
              { label: 'Gentle & Slow (0.75x)', val: 0.75 },
              { label: 'Recommended (0.88x)', val: 0.88 },
              { label: 'Natural (1.0x)', val: 1.0 }
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onClick={() => handleSpeedChange(item.val)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  speechSpeed === item.val
                    ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* COPPA / Child Safety Notice */}
        <div className="card-pastel p-6 border-2 border-emerald-200 bg-emerald-50/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h3 className="text-base font-bold text-emerald-950">Child Privacy & Safety Notice</h3>
          </div>
          <div className="text-xs text-emerald-900/90 space-y-2 leading-relaxed">
            <p>
              • <strong>Zero Real Identity:</strong> We never collect full names, telephone numbers, home addresses, or emails of children.
            </p>
            <p>
              • <strong>No Audio Stored:</strong> Voice inputs via Web Speech API are processed locally in your browser. We never record or store audio files.
            </p>
            <p>
              • <strong>Strict Guardrails:</strong> The companion never provides psychiatric diagnoses, encourages secrecy from parents, or displays commercial advertisements.
            </p>
            <p>
              • <strong>Adult Referral:</strong> Any expression of danger or harm prompts an immediate, reassuring instruction to seek help from a trusted adult.
            </p>
          </div>
        </div>

        {/* Data Reset & Deletion */}
        <div className="card-pastel p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Learning Progress Reset</h3>
            <p className="text-xs text-slate-600 mb-3">
              Reset star counts, skill badges, and mastery history while keeping your avatar profile.
            </p>
            <button
              type="button"
              onClick={handleResetProgress}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Learning Progress</span>
            </button>
            {resetSuccess && (
              <span className="ml-3 text-xs text-emerald-600 font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reset Complete!
              </span>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-rose-700 mb-1">Delete All Stored Data</h3>
            <p className="text-xs text-slate-600 mb-3">
              Permanently erase this learner account, chat turns, and activity logs from our persistent database.
            </p>

            {!deleteConfirm ? (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Learner Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteData}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition shadow-sm"
                >
                  Yes, Permanently Delete Now
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
