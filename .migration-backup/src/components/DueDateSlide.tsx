import React from 'react';
import { Calendar } from 'lucide-react';

const DueDateSlide: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-12 max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800">CS3560 Homework 3</h1>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Due Date</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">April 13, 2025</p>
              <p className="text-gray-600 mt-1">End of Day</p>
            </div>
            <div className="h-12 w-0.5 bg-blue-200 mx-6"></div>
            <div>
              <p className="text-gray-700 font-medium">Submit via:</p>
              <p className="text-blue-600 font-semibold">Blackboard</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <p className="text-gray-700">
              This is a group project with teams of 3-6 students
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <p className="text-gray-700">
              Design and document a Wilderness Survival System (WSS)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <p className="text-gray-700">
              Required deliverables include class diagrams, state diagrams, use cases, and interaction diagrams
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Note: Implementation (Homework 4) will be due at the end of the class
          </p>
        </div>
      </div>
    </div>
  );
};

export default DueDateSlide;