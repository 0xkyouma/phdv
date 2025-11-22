"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { Switch } from "@/components/ui/switch"
import { Activity, Brain, Heart, Moon, TrendingUp, Zap, Coins, Share2, AlertCircle, Download, FileText, Calendar, CheckCircle, Clock, Sparkles, ChevronDown, ChevronUp, Shield, AlertTriangle, Info, ArrowRight, Stethoscope, Lightbulb } from "lucide-react"
import { DataUploadDialog } from "@/components/data-upload-dialog"
import { useAccount } from 'wagmi'
import { DashboardResponse } from '@/types/health'

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`border border-cyan-400/50 bg-cyan-900/10 backdrop-blur-sm rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

export default function Dashboard() {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, Set<string>>>({});
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useAccount();

  const toggleReport = (id: string) => {
    setExpandedReport(expandedReport === id ? null : id);
  };

  const toggleSection = (reportId: string, section: string) => {
    setExpandedSections(prev => {
      const reportSections = prev[reportId] || new Set();
      const newSections = new Set(reportSections);

      if (newSections.has(section)) {
        newSections.delete(section);
      } else {
        newSections.add(section);
      }

      return {
        ...prev,
        [reportId]: newSections
      };
    });
  };

  const isSectionExpanded = (reportId: string, section: string) => {
    return expandedSections[reportId]?.has(section) || false;
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard?walletAddress=${address}`);
      const data: DashboardResponse = await response.json();

      if (data.success) {
        setDashboardData(data);
      } else {
        console.error('Dashboard API error:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen text-white px-8 md:px-20 lg:px-40 pt-24 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold">Health Dashboard</h1>
          <p className="text-gray-400">Your personal health insights and data vault</p>
        </div>
        <div className="flex items-center space-x-4">
          <DataUploadDialog onAnalysisComplete={fetchDashboardData} />
          <div className="text-right border border-cyan-400/50 rounded-full px-4 py-1">
            <p className="text-gray-400 text-xs">Token Balance</p>
            <p className="text-lg font-bold">
              {loading ? '...' : dashboardData?.data?.user.tokens || 0} PHDV
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-8">
        {/* Empty State Alert */}
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-1">No Real-Time Data Connected</h3>
              <p className="text-sm text-gray-400">
                Connect your wearable devices or upload health data to start tracking your metrics and earning tokens.
              </p>
            </div>
          </div>
        </Card>

        {/* Uploaded Reports Section */}
        <Card className="md:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                <h2 className="font-bold text-xl">Uploaded Health Reports</h2>
              </div>
              <p className="text-gray-400">AI-analyzed reports with personalized insights</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Reports</p>
              <p className="text-2xl font-bold text-cyan-400">
                {loading ? '...' : dashboardData?.data?.stats.totalReports || 0}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading reports...</p>
            </div>
          ) : !isConnected ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-400">Please connect your wallet to view reports</p>
            </div>
          ) : dashboardData?.data?.reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No reports uploaded yet</p>
              <p className="text-sm text-gray-500 mt-2">Upload your first health report to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData?.data?.reports.map((report) => (
                <div
                  key={report.id}
                  className="border border-cyan-400/30 rounded-xl overflow-hidden hover:border-cyan-400/50 transition-all"
                >
                  {/* Report Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-cyan-400/5 transition-colors"
                    onClick={() => toggleReport(report.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 border border-cyan-400/30">
                            <FileText className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">{report.analysisData?.title || report.fileName}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(report.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400">
                                {report.analysisData?.documentType || report.fileType}
                              </span>
                              <span className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                AI Analysis Complete
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        {expandedReport === report.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Analysis Details - Expandable */}
                  {expandedReport === report.id && report.analysisData && (
                    <div className="border-t border-cyan-400/20 bg-cyan-900/5 p-5 space-y-6">
                      {/* Document Title */}
                      {report.analysisData.title && (
                        <div className="pb-4 border-b border-cyan-400/10">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            {report.analysisData.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                            {report.analysisData.documentType && (
                              <span className="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/30">
                                {report.analysisData.documentType}
                              </span>
                            )}
                            {report.analysisData.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Report Date: {report.analysisData.date}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* AI Summary */}
                      {report.analysisData.summary && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/30">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white mb-2">AI Summary</h4>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {report.analysisData.summary}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Risk Assessment */}
                      {report.analysisData.riskAssessment && (
                        <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-400/30 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${report.analysisData.riskAssessment.level === 'low'
                                ? 'bg-green-500/10 border border-green-500/30'
                                : report.analysisData.riskAssessment.level === 'moderate'
                                  ? 'bg-yellow-500/10 border border-yellow-500/30'
                                  : 'bg-red-500/10 border border-red-500/30'
                              }`}>
                              <Shield className={`h-4 w-4 ${report.analysisData.riskAssessment.level === 'low'
                                  ? 'text-green-400'
                                  : report.analysisData.riskAssessment.level === 'moderate'
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                                }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <h4 className="font-medium text-white">Risk Assessment</h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${report.analysisData.riskAssessment.level === 'low'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : report.analysisData.riskAssessment.level === 'moderate'
                                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}>
                                  {report.analysisData.riskAssessment.level.toUpperCase()} RISK
                                </span>
                              </div>

                              {report.analysisData.riskAssessment.factors && report.analysisData.riskAssessment.factors.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-400 mb-2 font-medium">Risk Factors:</p>
                                  <ul className="space-y-1">
                                    {report.analysisData.riskAssessment.factors.map((factor, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                        <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 shrink-0" />
                                        <span>{factor}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {report.analysisData.riskAssessment.followUpRequired && (
                                <div className="flex items-start gap-2 bg-cyan-400/5 border border-cyan-400/20 rounded-lg p-3 mt-3">
                                  <CheckCircle className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-white">Follow-up Required</p>
                                    {report.analysisData.riskAssessment.followUpTiming && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        Recommended timing: {report.analysisData.riskAssessment.followUpTiming}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Confidence Score */}
                      {report.analysisData.confidence !== undefined && (
                        <div className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-400/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">Analysis Confidence</h4>
                            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                              {report.analysisData.confidence}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500 rounded-full"
                              style={{ width: `${report.analysisData.confidence}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Detailed Analysis - Collapsible */}
                      {report.analysisData.detailedAnalysis && (
                        <div className="border border-cyan-400/20 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSection(report.id, 'detailedAnalysis')}
                            className="w-full flex items-center justify-between p-4 hover:bg-cyan-400/5 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-cyan-400" />
                              <h4 className="font-medium text-white">Detailed Analysis</h4>
                            </div>
                            {isSectionExpanded(report.id, 'detailedAnalysis') ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          {isSectionExpanded(report.id, 'detailedAnalysis') && (
                            <div className="p-4 pt-0">
                              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                                {report.analysisData.detailedAnalysis}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Medical Context & Education - Collapsible */}
                      {report.analysisData.medicalContext && (
                        <div className="border border-purple-400/20 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSection(report.id, 'medicalContext')}
                            className="w-full flex items-center justify-between p-4 hover:bg-purple-400/5 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-purple-400" />
                              <h4 className="font-medium text-white">Medical Context & Education</h4>
                            </div>
                            {isSectionExpanded(report.id, 'medicalContext') ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          {isSectionExpanded(report.id, 'medicalContext') && (
                            <div className="p-4 pt-0">
                              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                                {report.analysisData.medicalContext}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Findings */}
                      {report.analysisData.findings && report.analysisData.findings.length > 0 && (
                        <div>
                          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-cyan-400" />
                            Key Findings
                          </h4>
                          <div className="space-y-3">
                            {report.analysisData.findings.map((finding, index) => (
                              <div key={index} className="bg-cyan-400/5 border border-cyan-400/20 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <span className="text-cyan-400 mt-1">•</span>
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className="text-white font-medium">{finding.parameter}:</span>
                                      <span className="text-gray-300">
                                        {finding.value} {finding.unit}
                                      </span>
                                      {finding.referenceRange && (
                                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-700/30 rounded">
                                          Normal: {finding.referenceRange}
                                        </span>
                                      )}
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${finding.status === 'normal'
                                          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                          : finding.status === 'critical'
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                                        }`}>
                                        {finding.status}
                                      </span>
                                    </div>
                                    {finding.clinicalSignificance && (
                                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                        <span className="font-medium text-cyan-400">Clinical Significance:</span> {finding.clinicalSignificance}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Abnormal Values */}
                      {report.analysisData.abnormalValues && report.analysisData.abnormalValues.length > 0 && (
                        <div>
                          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                            Abnormal Values
                          </h4>
                          <div className="space-y-3">
                            {report.analysisData.abnormalValues.map((abnormal, index) => (
                              <div key={index} className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-1 shrink-0" />
                                  <div className="flex-1 space-y-3">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-white font-medium">{abnormal.parameter}:</span>
                                        <span className="text-gray-300">{abnormal.value}</span>
                                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-700/30 rounded">
                                          Expected: {abnormal.expectedRange}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${abnormal.severity === 'severe'
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                            : abnormal.severity === 'moderate'
                                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                          }`}>
                                          {abnormal.severity}
                                        </span>
                                      </div>
                                      {abnormal.meaning && (
                                        <p className="text-sm text-gray-300 mt-2">{abnormal.meaning}</p>
                                      )}
                                    </div>

                                    {abnormal.possibleCauses && abnormal.possibleCauses.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-yellow-400 mb-2">Possible Causes:</p>
                                        <ul className="space-y-1">
                                          {abnormal.possibleCauses.map((cause, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                              <span className="text-yellow-400 mt-1">•</span>
                                              <span>{cause}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {abnormal.recommendedActions && abnormal.recommendedActions.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-cyan-400 mb-2">Recommended Actions:</p>
                                        <ul className="space-y-1">
                                          {abnormal.recommendedActions.map((action, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                              <ArrowRight className="h-3 w-3 text-cyan-400 mt-1 shrink-0" />
                                              <span>{action}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations - Categorized */}
                      {report.analysisData.recommendations && report.analysisData.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                            <Brain className="h-4 w-4 text-cyan-400" />
                            AI Recommendations
                          </h4>
                          {/* Handle both new categorized format and legacy string array format */}
                          {typeof report.analysisData.recommendations[0] === 'string' ? (
                            // Legacy format: string[]
                            <ul className="space-y-2">
                              {(report.analysisData.recommendations as string[]).map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            // New format: RecommendationCategory[]
                            <div className="space-y-4">
                              {(report.analysisData.recommendations as Array<{ category: string; items: string[] }>).map((recCategory, idx) => (
                                <div key={idx} className="bg-cyan-400/5 border border-cyan-400/20 rounded-lg p-4">
                                  <h5 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                                    {recCategory.category === 'Immediate Actions' && <AlertCircle className="h-4 w-4" />}
                                    {recCategory.category === 'Lifestyle Modifications' && <Heart className="h-4 w-4" />}
                                    {recCategory.category === 'Follow-up Care' && <Calendar className="h-4 w-4" />}
                                    {recCategory.category}
                                  </h5>
                                  <ul className="space-y-2">
                                    {recCategory.items.map((item: string, itemIdx: number) => (
                                      <li key={itemIdx} className="flex items-start gap-2 text-sm text-gray-300">
                                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Disclaimer */}
                      {report.analysisData.disclaimer && (
                        <div className="flex items-start gap-3 bg-gray-700/20 border border-gray-600/30 rounded-lg p-4">
                          <Info className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {report.analysisData.disclaimer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Connected Data Sources - Empty State */}
        <Card className="md:col-span-3">
          <h2 className="font-bold mb-2 text-xl">Connected Data Sources</h2>
          <p className="text-gray-400 mb-4">No real-time data sources connected yet</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-cyan-400/20 rounded-lg p-4 flex justify-between items-center opacity-50">
              <div>
                <p className="font-semibold text-gray-400">Apple Health</p>
                <p className="text-sm text-gray-500">Not connected</p>
              </div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            </div>
            <div className="border border-cyan-400/20 rounded-lg p-4 flex justify-between items-center opacity-50">
              <div>
                <p className="font-semibold text-gray-400">Google Fit</p>
                <p className="text-sm text-gray-500">Not connected</p>
              </div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            </div>
            <div className="border border-cyan-400/20 rounded-lg p-4 flex justify-between items-center opacity-50">
              <div>
                <p className="font-semibold text-gray-400">Fitbit</p>
                <p className="text-sm text-gray-500">Not connected</p>
              </div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            </div>
            <div className="border border-cyan-400/20 rounded-lg p-4 flex justify-between items-center opacity-50">
              <div>
                <p className="font-semibold text-gray-400">Garmin</p>
                <p className="text-sm text-gray-500">Not connected</p>
              </div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            </div>
          </div>
        </Card>

        {/* Health Metrics Grid - Empty State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 border border-cyan-400/30">
                <Moon className="h-6 w-6 text-cyan-400/50" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Sleep Quality</h3>
                <p className="text-sm text-gray-500">No data available</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 border border-cyan-400/30">
                <Heart className="h-6 w-6 text-cyan-400/50" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Heart Rate Variability</h3>
                <p className="text-sm text-gray-500">No data available</p>
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 border border-cyan-400/30">
                <Activity className="h-6 w-6 text-cyan-400/50" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Activity Level</h3>
                <p className="text-sm text-gray-500">No data available</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Data Sharing & Earnings */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Coins className="h-5 w-5 text-cyan-400" />
            <h2 className="font-bold text-xl">Token Earnings</h2>
          </div>
          <p className="text-gray-400 mb-6">Start sharing data to earn PHDV tokens</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-gray-500 text-sm mb-2">This Week</p>
              <p className="text-3xl font-bold text-cyan-400">
                {loading ? '...' : (dashboardData?.data?.stats.reportsThisWeek || 0) * 50} PHDV
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-2">This Month</p>
              <p className="text-3xl font-bold text-cyan-400">
                {loading ? '...' : (dashboardData?.data?.stats.reportsThisMonth || 0) * 50} PHDV
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-2">All Time</p>
              <p className="text-3xl font-bold text-cyan-400">
                {loading ? '...' : dashboardData?.data?.user.tokens || 0} PHDV
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-2">Total Reports</p>
              <p className="text-3xl font-bold text-cyan-400">
                {loading ? '...' : dashboardData?.data?.user.totalAnalyses || 0}
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-cyan-400/30 text-center">
            <p className="text-sm text-gray-400">
              Upload health data and connect devices to start earning tokens
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
