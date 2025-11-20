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

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("walletAddress", address)

      const response = await fetch("/api/analyze-health?format=json", {
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
      }
    } catch (err: any) {
      console.error("Analysis error:", err)
      setError(err.message || "Failed to analyze file")
    } finally {
      setAnalyzing(false)
    }
  }

  const resetDialog = () => {
    setSelectedFile(null)
    setShowResults(false)
    setAnalysisResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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
                        <span>🔬 Analyze with AI</span>
                      )}
                    </button>

                    {!address && (
                      <p className="text-xs text-yellow-400 text-center">
                        Please connect your wallet to analyze
                      </p>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                    {error}
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

                <div className="bg-cyan-900/5 p-5 space-y-6 max-h-[400px] overflow-y-auto">
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
                    </div>
                  </div>

                  {/* Key Findings */}
                  {analysisResult.analysis.findings && analysisResult.analysis.findings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-cyan-400" />
                        Key Findings
                      </h4>
                      <div className="space-y-2">
                        {analysisResult.analysis.findings.map((finding, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
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
                            <div className="flex-1">
                              <span className="text-white font-medium">{finding.parameter}:</span>
                              <span className="text-gray-300">
                                {" "}
                                {finding.value} {finding.unit}
                              </span>
                              {finding.referenceRange && (
                                <span className="text-gray-400 text-xs ml-2">
                                  (Range: {finding.referenceRange})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
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
                              className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3"
                            >
                              <div className="flex items-start justify-between mb-1">
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
                              <p className="text-sm text-gray-300">
                                Value: {abnormal.value} (Expected: {abnormal.expectedRange})
                              </p>
                              {abnormal.meaning && (
                                <p className="text-xs text-gray-400 mt-2">{abnormal.meaning}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Recommendations */}
                  {analysisResult.analysis.recommendations &&
                    analysisResult.analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-cyan-400" />
                          AI Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {analysisResult.analysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="text-green-400 mt-1">✓</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
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
