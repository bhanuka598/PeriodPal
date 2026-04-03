import React, { useEffect, useState } from "react";
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  HeartPulse,
  BarChart3,
  PieChart,
  Info
} from "lucide-react";
import { recordService } from "../../services/recordService";

// Simple bar chart component
function BarChart({ data, maxValue, colorClass }) {
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div 
            className={`w-full rounded-t ${colorClass} transition-all duration-500`}
            style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: '4px' }}
          />
          <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">{item.label}</span>
          <span className="text-xs font-semibold text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// Progress ring component
function ProgressRing({ value, max, color, label }) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{value}</span>
        </div>
      </div>
      <span className="text-sm text-gray-600 mt-2 text-center">{label}</span>
    </div>
  );
}

export function MenstrualAnalysisDashboard() {
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalRecords: 0,
    averageCycleLength: 0,
    irregularCycles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState({
    cycleDistribution: [],
    symptomFrequency: [],
    flowDistribution: [],
    monthlyTrends: [],
    healthAlerts: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await recordService.getAllRecordsAdmin();
      setRecords(data.records);
      setAnalytics(data.analytics);
      
      // Calculate analysis data
      const calculatedAnalysis = calculateAnalysis(data.records);
      setAnalysis(calculatedAnalysis);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalysis = (records) => {
    if (!records.length) return {
      cycleDistribution: [],
      symptomFrequency: [],
      flowDistribution: [],
      monthlyTrends: [],
      healthAlerts: []
    };

    // Cycle length distribution
    const cycleRanges = [
      { label: "Short (<21)", min: 0, max: 20, count: 0 },
      { label: "Normal (21-35)", min: 21, max: 35, count: 0 },
      { label: "Long (>35)", min: 36, max: 999, count: 0 }
    ];
    
    records.forEach(r => {
      const range = cycleRanges.find(range => 
        r.cycleLength >= range.min && r.cycleLength <= range.max
      );
      if (range) range.count++;
    });

    // Symptom frequency
    const symptomCounts = {};
    records.forEach(r => {
      r.symptoms?.forEach(s => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      });
    });
    const symptomFrequency = Object.entries(symptomCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Flow intensity distribution
    const flowCounts = { Light: 0, Medium: 0, Heavy: 0 };
    records.forEach(r => {
      if (flowCounts[r.flowIntensity] !== undefined) {
        flowCounts[r.flowIntensity]++;
      }
    });
    const flowDistribution = Object.entries(flowCounts)
      .map(([label, value]) => ({ label, value }))
      .filter(item => item.value > 0);

    // Monthly trends (last 6 months)
    const monthlyData = {};
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[key] = 0;
    }
    
    records.forEach(r => {
      const date = new Date(r.createdAt || r.lastPeriodDate);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    });
    
    const monthlyTrends = Object.entries(monthlyData)
      .map(([label, value]) => ({ label, value }));

    // Irregular cycle alerts (anonymous)
    const irregularCount = records.filter(r => r.cycleLength < 21 || r.cycleLength > 35).length;

    return {
      cycleDistribution: cycleRanges.map(r => ({ label: r.label, value: r.count })),
      symptomFrequency,
      flowDistribution,
      monthlyTrends,
      irregularCount
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const maxSymptomValue = Math.max(...analysis.symptomFrequency.map(s => s.value), 1);
  const maxMonthlyValue = Math.max(...analysis.monthlyTrends.map(m => m.value), 1);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Menstrual Health Analysis</h1>
          <p className="mt-2 text-gray-600">Privacy-focused insights and trends for all beneficiaries</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalRecords}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Cycle</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageCycleLength} days</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Irregular Cycles</p>
                <p className="text-2xl font-bold text-red-600">{analytics.irregularCycles}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cycle Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="h-5 w-5 text-rose-500" />
              <h3 className="text-lg font-semibold text-gray-900">Cycle Length Distribution</h3>
            </div>
            <div className="flex justify-around items-center">
              {analysis.cycleDistribution.map((item, index) => {
                const colors = [
                  "text-red-500 stroke-red-500",
                  "text-green-500 stroke-green-500", 
                  "text-orange-500 stroke-orange-500"
                ];
                return (
                  <ProgressRing
                    key={item.label}
                    value={item.value}
                    max={analytics.totalRecords || 1}
                    color={colors[index]}
                    label={item.label}
                  />
                );
              })}
            </div>
          </div>

          {/* Flow Intensity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <HeartPulse className="h-5 w-5 text-rose-500" />
              <h3 className="text-lg font-semibold text-gray-900">Flow Intensity Breakdown</h3>
            </div>
            <div className="space-y-4">
              {analysis.flowDistribution.map((item) => {
                const colors = {
                  Light: "bg-green-500",
                  Medium: "bg-yellow-500",
                  Heavy: "bg-red-500"
                };
                const percentage = analytics.totalRecords 
                  ? Math.round((item.value / analytics.totalRecords) * 100) 
                  : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className="text-sm text-gray-500">{item.value} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`${colors[item.label]} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-rose-500" />
              <h3 className="text-lg font-semibold text-gray-900">Monthly Activity Trends</h3>
            </div>
            {analysis.monthlyTrends.length > 0 ? (
              <BarChart 
                data={analysis.monthlyTrends} 
                maxValue={maxMonthlyValue}
                colorClass="bg-blue-500"
              />
            ) : (
              <p className="text-gray-500 text-center py-8">No monthly data available</p>
            )}
          </div>

          {/* Symptom Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-rose-500" />
              <h3 className="text-lg font-semibold text-gray-900">Common Symptoms</h3>
            </div>
            {analysis.symptomFrequency.length > 0 ? (
              <BarChart 
                data={analysis.symptomFrequency} 
                maxValue={maxSymptomValue}
                colorClass="bg-rose-500"
              />
            ) : (
              <p className="text-gray-500 text-center py-8">No symptom data available</p>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Privacy-First Analytics</h4>
              <p className="text-sm text-blue-700 mt-1">
                This dashboard displays aggregated insights only. Individual period dates and personal health details 
                are not shown to protect beneficiary privacy. Health alerts are based on cycle pattern analysis only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
