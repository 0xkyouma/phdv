"use client"

import { useState, useRef } from "react"
import { useAccount } from "wagmi"
import {
  Upload,
  FileText,
  Activity,
  Dna,
  Database,
  Check,
  X,
  Loader2,
  Brain,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Coins,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react"
import type { HealthAnalysisResponse } from "@/types/health"

const uploadTypes = [
  {
    id: "wearable",
    title: "Wearable Devices",
    description: "Apple Health, Google Fit, Fitbit, Garmin",
    icon: Activity,
    formats: "JSON, XML",
  },
  {
    id: "lab",
    title: "Lab Results",
    description: "Blood tests, imaging reports, clinical data",
    icon: FileText,
    formats: "PDF, JSON, HL7 FHIR",
  },
  {
    id: "genome",
    title: "Genomic Data",
    description: "23andMe, Ancestry, whole genome sequencing",
    icon: Dna,
    formats: "VCF, FASTQ, BAM",
  },
  {
    id: "research",
    title: "Research Data",
    description: "Clinical trials, surveys, longitudinal studies",
    icon: Database,
    formats: "CSV, Parquet, JSON",
  },
]

interface DataUploadDialogProps {
  onAnalysisComplete?: () => void;
}

export function DataUploadDialog({ onAnalysisComplete }: DataUploadDialogProps = {}) {
  const { address } = useAccount()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<HealthAnalysisResponse | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [tokenAnimation, setTokenAnimation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    detailedAnalysis: false,
    medicalContext: false,
    findings: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError("File too large. Maximum size: 20MB")
        return
      }
      setSelectedFile(file)
      setShowResults(false)
      setError(null)
      setErrorDetails(null)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile || !address) {
      setError("Please connect your wallet and select a file")
      return
    }

    setAnalyzing(true)
    setShowResults(false)
    setError(null)
    setErrorDetails(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("walletAddress", address)

      const response = await fetch("/api/analyze-health", {
        method: "POST",
        body: formData,
      })

      const result: HealthAnalysisResponse = await response.json()

      if (result.success && result.analysis) {
        setAnalysisResult(result)
        setShowResults(true)
        setTokenAnimation(true)
        setTimeout(() => setTokenAnimation(false), 2000)

        // Trigger callback to refresh dashboard data
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      } else {
        setError(result.error || "Analysis failed")
        setErrorDetails(result.details || null)
      }
    } catch (err: any) {
      console.error("Analysis error:", err)
      setError(err.message || "Failed to analyze file")
      setErrorDetails("Please check your internet connection and try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  const resetDialog = () => {
    setSelectedFile(null)
    setShowResults(false)
    setAnalysisResult(null)
    setError(null)
    setErrorDetails(null)
    setExpandedSections({
      detailedAnalysis: false,
      medicalContext: false,
      findings: true,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getErrorIcon = () => {
    if (!error) return null
    if (error.includes("not health-related")) return AlertTriangle
    if (error.includes("too large") || error.includes("format")) return ShieldAlert
    return AlertCircle
  }

  const getErrorStyle = () => {
    if (!error) return ""
    if (error.includes("not health-related"))
      return "bg-orange-500/10 border-orange-500/30 text-orange-400"
    if (error.includes("too large") || error.includes("format"))
      return "bg-red-500/10 border-red-500/30 text-red-400"
    return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'moderate': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative group border-2 border-cyan-400 bg-cyan-400/10 text-white font-bold py-3 px-6 rounded-full hover:bg-cyan-400 hover:text-white transition-all duration-300 flex items-center gap-3 shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/40 hover:scale-105 animate-pulse"
      >
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md group-hover:bg-cyan-400/30 transition-all duration-300"></div>
        <Upload className="h-5 w-5 relative z-10" />
        <span className="relative z-10 text-base">Upload Health Data</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-cyan-400/50 rounded-2xl p-6 m-4">
            <button
              onClick={() => {
                setIsOpen(false)
                resetDialog()
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Upload Health Data</h2>
              <p className="text-gray-400">
                Choose the type of health data you want to upload. AI will analyze it and you'll earn PHDV tokens.
              </p>
            </div>

            {/* Type Selection */}
            {!analyzing && !showResults && (
              <div className="grid gap-4 mb-6">
                {uploadTypes.map((type) => {
                  const Icon = type.icon
                  const isSelected = selectedType === type.id
                  return (
                    <div
                      key={type.id}
                      className={`p-4 cursor-pointer transition-all rounded-xl border ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-400/10"
                          : "border-cyan-400/30 bg-cyan-900/10 hover:border-cyan-400/50 hover:bg-cyan-900/20"
                      }`}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? "bg-cyan-400 text-white" : "bg-cyan-400/10 text-cyan-400"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-white">{type.title}</h4>
                            {isSelected && <Check className="h-5 w-5 text-cyan-400" />}
                          </div>
                          <p className="text-sm text-gray-400">{type.description}</p>
                          <p className="text-xs text-gray-500">Supported formats: {type.formats}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* File Upload Area */}
            {selectedType && !analyzing && !showResults && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.csv,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cyan-400/30 rounded-lg p-8 text-center space-y-4 cursor-pointer hover:border-cyan-400/50 hover:bg-cyan-900/5 transition-all"
                  >
                    <Upload className="h-12 w-12 mx-auto text-cyan-400/50" />
                    <div>
                      <p className="font-medium text-white">Click to select file</p>
                      <p className="text-sm text-gray-400">PDF, CSV, DOC, DOCX, PNG, JPEG (Max 20MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selected File Info */}
                    <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-cyan-400" />
                          <div>
                            <p className="text-white font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-gray-400">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={resetDialog}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Analyze Button */}
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing || !address}
                      className="w-full border-2 border-cyan-400 bg-cyan-400/10 text-white font-bold py-3 px-6 rounded-full hover:bg-cyan-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {analyzing ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Analyzing...</span>
                        </div>
                      ) : (
                        <span>Analyze with AI</span>
                      )}
                    </button>

                    {!address && (
                      <p className="text-xs text-yellow-400 text-center">
                        Please connect your wallet to analyze
                      </p>
                    )}
                  </div>
                )}

                {/* Enhanced Error Message */}
                {error && (
                  <div className={`border rounded-lg p-4 ${getErrorStyle()}`}>
                    <div className="flex items-start gap-3">
                      {(() => {
                        const ErrorIcon = getErrorIcon()
                        return ErrorIcon ? <ErrorIcon className="h-5 w-5 mt-0.5 flex-shrink-0" /> : null
                      })()}
                      <div className="flex-1 space-y-2">
                        <p className="font-medium">{error}</p>
                        {errorDetails && (
                          <div className="text-sm opacity-90 whitespace-pre-line">
                            {errorDetails}
                          </div>
                        )}
                        <button
                          onClick={resetDialog}
                          className="mt-2 text-sm underline hover:no-underline"
                        >
                          Try another file
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Info */}
                <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm text-white">Privacy & Security</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• All data is encrypted end-to-end before upload</li>
                    <li>• Personal identifiers are automatically removed</li>
                    <li>• You maintain full control over data sharing</li>
                    <li>• Data can be deleted at any time</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Analyzing Animation */}
            {analyzing && (
              <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Brain className="h-12 w-12 text-cyan-400 animate-pulse" />
                    <Sparkles className="h-6 w-6 text-purple-400 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">AI Analysis in Progress</p>
                    <p className="text-sm text-gray-400">
                      Examining your health data with advanced AI...
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Token Reward */}
            {showResults && analysisResult?.tokenReward && (
              <div
                className={`bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-2 border-cyan-400 rounded-xl p-4 mb-4 ${
                  tokenAnimation ? "animate-scale-in" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400">
                      <Coins className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Earned Reward</p>
                      <p className="text-xl font-bold text-white flex items-center gap-1">
                        <span className={tokenAnimation ? "animate-bounce" : ""}>+</span>
                        {analysisResult.tokenReward.earned} PHDV
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total Balance</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {analysisResult.tokenReward.total} PHDV
                    </p>
                  </div>
                </div>
                {analysisResult.tokenReward.isNewUser && (
                  <div className="mt-3 pt-3 border-t border-cyan-400/30">
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Welcome bonus included! First upload reward.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Results */}
            {showResults && analysisResult?.analysis && (
              <div className="border border-cyan-400/30 rounded-xl overflow-hidden">
                <div className="border-b border-cyan-400/20 bg-cyan-900/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <h3 className="font-bold text-white">Analysis Complete</h3>
                  </div>
                </div>

                <div className="bg-cyan-900/5 p-5 space-y-6 max-h-[500px] overflow-y-auto">
                  {/* Document Title */}
                  {analysisResult.analysis.title && (
                    <div className="pb-4 border-b border-cyan-400/20">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {analysisResult.analysis.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{analysisResult.analysis.documentType}</span>
                        {analysisResult.analysis.date && (
                          <>
                            <span>•</span>
                            <span>{analysisResult.analysis.date}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Risk Assessment */}
                  {analysisResult.analysis.riskAssessment && (
                    <div className="bg-gray-900/50 border border-cyan-400/20 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-white flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-cyan-400" />
                          Risk Assessment
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(analysisResult.analysis.riskAssessment.level)}`}>
                          {analysisResult.analysis.riskAssessment.level.toUpperCase()} RISK
                        </span>
                      </div>
                      {analysisResult.analysis.riskAssessment.factors.length > 0 && (
                        <ul className="space-y-1 mb-3">
                          {analysisResult.analysis.riskAssessment.factors.map((factor, idx) => (
                            <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                              <span className="text-cyan-400 mt-1">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {analysisResult.analysis.riskAssessment.followUpRequired && (
                        <div className="pt-3 border-t border-cyan-400/20">
                          <p className="text-sm text-yellow-400 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Follow-up required: {analysisResult.analysis.riskAssessment.followUpTiming}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Summary */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/30">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-2">AI Summary</h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {analysisResult.analysis.summary}
                      </p>
                      {analysisResult.analysis.confidence && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                            <span>Confidence Score</span>
                            <span>{analysisResult.analysis.confidence}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${analysisResult.analysis.confidence}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detailed Analysis - Collapsible */}
                  {analysisResult.analysis.detailedAnalysis && (
                    <div className="border border-cyan-400/20 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection('detailedAnalysis')}
                        className="w-full p-3 bg-cyan-900/20 hover:bg-cyan-900/30 transition-colors flex items-center justify-between"
                      >
                        <h4 className="font-medium text-white flex items-center gap-2">
                          <Brain className="h-4 w-4 text-cyan-400" />
                          Detailed Analysis
                        </h4>
                        {expandedSections.detailedAnalysis ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      {expandedSections.detailedAnalysis && (
                        <div className="p-4 bg-gray-900/30">
                          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                            {analysisResult.analysis.detailedAnalysis}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Medical Context - Collapsible */}
                  {analysisResult.analysis.medicalContext && (
                    <div className="border border-cyan-400/20 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection('medicalContext')}
                        className="w-full p-3 bg-cyan-900/20 hover:bg-cyan-900/30 transition-colors flex items-center justify-between"
                      >
                        <h4 className="font-medium text-white flex items-center gap-2">
                          <Info className="h-4 w-4 text-cyan-400" />
                          Medical Context & Education
                        </h4>
                        {expandedSections.medicalContext ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      {expandedSections.medicalContext && (
                        <div className="p-4 bg-gray-900/30">
                          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                            {analysisResult.analysis.medicalContext}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Key Findings - Collapsible */}
                  {analysisResult.analysis.findings && analysisResult.analysis.findings.length > 0 && (
                    <div className="border border-cyan-400/20 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection('findings')}
                        className="w-full p-3 bg-cyan-900/20 hover:bg-cyan-900/30 transition-colors flex items-center justify-between"
                      >
                        <h4 className="font-medium text-white flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-cyan-400" />
                          Key Findings ({analysisResult.analysis.findings.length})
                        </h4>
                        {expandedSections.findings ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      {expandedSections.findings && (
                        <div className="p-4 bg-gray-900/30 space-y-3">
                          {analysisResult.analysis.findings.map((finding, idx) => (
                            <div key={idx} className="bg-gray-900/50 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-white font-medium">{finding.parameter}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    finding.status === "normal"
                                      ? "bg-green-500/10 text-green-400"
                                      : finding.status === "low" || finding.status === "high"
                                      ? "bg-yellow-500/10 text-yellow-400"
                                      : "bg-red-500/10 text-red-400"
                                  }`}
                                >
                                  {finding.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-sm text-gray-300 space-y-1">
                                <p>
                                  Value: <span className="text-white">{finding.value} {finding.unit}</span>
                                </p>
                                {finding.referenceRange && (
                                  <p className="text-gray-400">
                                    Reference Range: {finding.referenceRange}
                                  </p>
                                )}
                                {finding.category && (
                                  <p className="text-gray-400">
                                    Category: {finding.category}
                                  </p>
                                )}
                                {finding.clinicalSignificance && (
                                  <p className="text-cyan-300 mt-2 pt-2 border-t border-cyan-400/20">
                                    {finding.clinicalSignificance}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Abnormal Values */}
                  {analysisResult.analysis.abnormalValues &&
                    analysisResult.analysis.abnormalValues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-400" />
                          Attention Required
                        </h4>
                        <div className="space-y-3">
                          {analysisResult.analysis.abnormalValues.map((abnormal, idx) => (
                            <div
                              key={idx}
                              className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-white font-medium">{abnormal.parameter}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    abnormal.severity === "mild"
                                      ? "bg-yellow-500/20 text-yellow-300"
                                      : abnormal.severity === "moderate"
                                      ? "bg-orange-500/20 text-orange-300"
                                      : "bg-red-500/20 text-red-300"
                                  }`}
                                >
                                  {abnormal.severity}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 mb-2">
                                Value: {abnormal.value} (Expected: {abnormal.expectedRange})
                              </p>
                              {abnormal.meaning && (
                                <p className="text-sm text-gray-300 mb-3 pb-3 border-b border-yellow-500/20">
                                  {abnormal.meaning}
                                </p>
                              )}
                              {abnormal.possibleCauses && abnormal.possibleCauses.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-medium text-gray-400 mb-1">Possible Causes:</p>
                                  <ul className="space-y-1">
                                    {abnormal.possibleCauses.map((cause, i) => (
                                      <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                        <span className="text-yellow-400 mt-0.5">•</span>
                                        <span>{cause}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {abnormal.recommendedActions && abnormal.recommendedActions.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-400 mb-1">Recommended Actions:</p>
                                  <ul className="space-y-1">
                                    {abnormal.recommendedActions.map((action, i) => (
                                      <li key={i} className="text-xs text-cyan-300 flex items-start gap-2">
                                        <span className="text-cyan-400 mt-0.5">→</span>
                                        <span>{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Categorized Recommendations */}
                  {analysisResult.analysis.recommendations &&
                    analysisResult.analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-cyan-400" />
                          AI Recommendations
                        </h4>
                        {/* Handle both new categorized format and legacy string array format */}
                        {typeof analysisResult.analysis.recommendations[0] === 'string' ? (
                          // Legacy format: string[]
                          <ul className="space-y-2">
                            {(analysisResult.analysis.recommendations as string[]).map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="text-green-400 mt-1">✓</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          // New format: RecommendationCategory[]
                          <div className="space-y-3">
                            {(analysisResult.analysis.recommendations as Array<{category: string; items: string[]}>).map((recCategory, idx) => (
                              <div key={idx} className="bg-cyan-900/20 border border-cyan-400/20 rounded-lg p-4">
                                <h5 className="text-sm font-medium text-cyan-400 mb-2">
                                  {recCategory.category}
                                </h5>
                                <ul className="space-y-2">
                                  {recCategory.items.map((item: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                      <span className="text-green-400 mt-1">✓</span>
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
                  {analysisResult.analysis.disclaimer && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        <span className="font-medium text-gray-300">Disclaimer:</span>{" "}
                        {analysisResult.analysis.disclaimer}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t border-cyan-400/20 bg-cyan-900/10 p-4 flex gap-3">
                  <button
                    onClick={resetDialog}
                    className="flex-1 border border-cyan-400/50 text-cyan-400 font-medium py-2 px-4 rounded-full hover:bg-cyan-400/10 transition-colors"
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      // Refresh dashboard when closing after successful analysis
                      if (onAnalysisComplete) {
                        onAnalysisComplete()
                      }
                    }}
                    className="flex-1 bg-cyan-400 text-white font-medium py-2 px-4 rounded-full hover:bg-cyan-500 transition-colors"
                  >
                    View Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
