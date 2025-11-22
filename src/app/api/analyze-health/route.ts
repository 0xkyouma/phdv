import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, HealthAnalysisResponse } from '@/types/health';
import dbConnect from '@/lib/mongodb';
import HealthAnalysis from '@/lib/models/HealthAnalysis';
import { rewardUserForAnalysis } from '@/lib/services/userService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const HEALTH_DOCUMENT_CHECK_PROMPT = `
Analyze this document and determine if it is a health/medical document.

A health/medical document includes:
- Lab test results (blood tests, urine tests, etc.)
- Medical reports (X-ray, MRI, CT scan, ultrasound reports)
- Doctor's notes or prescriptions
- Vaccination records
- Health screening results
- Medical diagnosis or treatment plans
- Health monitoring data
- Medical imaging reports

Respond ONLY with a JSON object in this format:
{
  "isHealthDocument": true/false,
  "confidence": 0-100,
  "documentType": "Brief description of document type",
  "reason": "Explanation of why this is or isn't a health document"
}

Be strict: if the document is clearly NOT related to health/medical data, set isHealthDocument to false.
`;

const JSON_ANALYSIS_PROMPT = `
Analyze this medical/health document in comprehensive detail and respond in the following JSON format:

{
  "title": "Generate a clear, descriptive title based on document content",
  "documentType": "Document type (Blood Test, Medical Report, X-Ray Report, etc.)",
  "date": "Document date (if available)",
  "patientInfo": {
    "name": "Patient name (if available)",
    "age": "Age (if available)",
    "gender": "Gender (if available)",
    "id": "Patient ID/protocol number (if available)"
  },
  "findings": [
    {
      "parameter": "Test/parameter name",
      "value": "Measured value",
      "unit": "Unit (mg/dL, g/L, etc.)",
      "referenceRange": "Normal reference range",
      "status": "normal/low/high/critical",
      "category": "Category (Hemogram, Biochemistry, etc.)",
      "clinicalSignificance": "Detailed explanation of what this value means for health (2-3 sentences)"
    }
  ],
  "abnormalValues": [
    {
      "parameter": "Abnormal parameter name",
      "value": "Measured value",
      "expectedRange": "Expected value range",
      "severity": "mild/moderate/severe",
      "meaning": "Detailed explanation of possible meaning and significance (3-4 sentences)",
      "possibleCauses": ["Cause 1", "Cause 2", "Cause 3"],
      "recommendedActions": ["Action 1", "Action 2"]
    }
  ],
  "summary": "Comprehensive summary of overall health status (4-6 sentences minimum). Include overview of tests, general health assessment, most significant findings, and risk level.",
  "detailedAnalysis": "In-depth analysis of the health data, including: patterns observed, correlations between parameters, overall health trends, and clinical interpretation. (Minimum 200 words)",
  "medicalContext": "Educational information about what these tests measure, why they're important, what normal ranges mean, and common causes of abnormalities. (Minimum 150 words)",
  "recommendations": [
    {
      "category": "Immediate Actions",
      "items": ["Detailed recommendation 1 with reasoning", "Detailed recommendation 2 with reasoning"]
    },
    {
      "category": "Lifestyle Modifications",
      "items": ["Detailed lifestyle advice", "Nutritional recommendations", "Exercise suggestions"]
    },
    {
      "category": "Follow-up Care",
      "items": ["When to schedule next tests", "Which parameters to monitor", "When to consult physician"]
    }
  ],
  "riskAssessment": {
    "level": "low/moderate/high",
    "factors": ["Risk factor 1 with explanation", "Risk factor 2 with explanation"],
    "followUpRequired": true/false,
    "followUpTiming": "Recommended timing for next check-up"
  },
  "confidence": 85,
  "disclaimer": "This AI analysis is for informational purposes only and does not replace professional medical advice. Always consult with a qualified healthcare provider for medical decisions."
}

IMPORTANT:
- Respond ONLY in JSON format, no additional explanations or markdown code blocks
- Write ALL content in ENGLISH
- Generate a descriptive, specific title based on document content
- Provide DETAILED explanations (comprehensive analysis, minimum 500 words total across all fields)
- If information is not available in the document, leave the field empty or null
- Include medical terms in English with clear explanations
- Explain clinical significance for ALL parameters
- Highlight critical values with detailed reasoning
- Explain possible causes and significance of abnormal values in detail
- Group findings by category (hematology, chemistry, etc.)
- Provide educational medical context
- Use professional medical language while remaining accessible
`;

export async function POST(request: Request) {
  try {
    // Connect to database
    await dbConnect();

    // Parse FormData with better error handling
    let formData;
    try {
      formData = await request.formData();
    } catch (formDataError) {
      return NextResponse.json<HealthAnalysisResponse>(
        {
          success: false,
          error: 'Invalid request format',
          details: 'Request body must be sent as multipart/form-data. Please ensure you are sending the file using FormData with the correct Content-Type header.'
        },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const walletAddress = formData.get('walletAddress') as string | null;

    if (!file) {
      return NextResponse.json<HealthAnalysisResponse>(
        {
          success: false,
          error: 'Dosya bulunamadı. Lütfen bir dosya yükleyin.'
        },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json<HealthAnalysisResponse>(
        {
          success: false,
          error: 'Wallet adresi gerekli. Lütfen wallet adresinizi gönderin.'
        },
        { status: 400 }
      );
    }

    // File type validation
    if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
      return NextResponse.json<HealthAnalysisResponse>(
        {
          success: false,
          error: `Desteklenmeyen dosya tipi: ${file.type}`,
          details: `Desteklenen formatlar: PDF, CSV, DOC, DOCX, PNG, JPEG`
        },
        { status: 400 }
      );
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<HealthAnalysisResponse>(
        {
          success: false,
          error: 'Dosya boyutu çok büyük',
          details: `Maksimum dosya boyutu: ${MAX_FILE_SIZE / 1024 / 1024}MB. Yüklenen dosya: ${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    // STEP 1: Check if document is health-related
    const checkResult = await model.generateContent([
      HEALTH_DOCUMENT_CHECK_PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const checkResponse = checkResult.response;
    const checkText = checkResponse.text();

    // Parse health check result
    let healthCheck;
    try {
      const cleanedCheckText = checkText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      healthCheck = JSON.parse(cleanedCheckText);
    } catch (parseError) {
      // If parsing fails, assume it might be health-related to avoid false negatives
      healthCheck = {
        isHealthDocument: true,
        confidence: 50,
        documentType: 'Unknown',
        reason: 'Could not verify document type'
      };
    }

    // If not a health document, return appropriate error
    if (!healthCheck.isHealthDocument) {
      return NextResponse.json<HealthAnalysisResponse>(
        {
          success: false,
          error: 'This document is not health-related',
          details: `Document Analysis:

Type: ${healthCheck.documentType}
Confidence: ${healthCheck.confidence}%

Reason: ${healthCheck.reason}

This system is designed exclusively for analyzing medical and health-related documents such as:
• Laboratory test results (blood tests, urine analysis, etc.)
• Medical imaging reports (X-ray, MRI, CT scan, ultrasound)
• Doctor's medical reports and prescriptions
• Vaccination records and immunization certificates
• Health screening and check-up results
• Medical diagnosis and treatment plans
• Chronic disease monitoring reports
• Medical examination findings

The uploaded document does not appear to contain medical or health data. Please upload a valid health document for analysis.

If you believe this is a medical document, please ensure:
1. The document is clearly readable and not corrupted
2. Medical terminology and test results are visible
3. The document format is supported (PDF, images, DOC, DOCX)

For accurate health analysis, please provide documents from:
- Hospitals and medical laboratories
- Licensed healthcare providers
- Certified medical diagnostic centers
- Official health institutions`
        },
        { status: 400 }
      );
    }

    // STEP 2: If health document confirmed, proceed with detailed analysis
    // Send to Gemini for JSON analysis
    const result = await model.generateContent([
      JSON_ANALYSIS_PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const response = result.response;
    const analysisText = response.text();

    // Parse JSON response
    let parsedAnalysis;
    try {
      // Remove markdown code blocks if present
      const cleanedText = analysisText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      parsedAnalysis = JSON.parse(cleanedText);
    } catch (parseError) {
      // If JSON parsing fails, return error with raw text
      return NextResponse.json<HealthAnalysisResponse>(
        {
          success: false,
          error: 'Failed to parse AI analysis',
          details: `The AI returned an invalid response format. Raw response: ${analysisText.substring(0, 500)}...`
        },
        { status: 500 }
      );
    }

    // Save to database
    await HealthAnalysis.create({
      walletAddress,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      format: 'json',
      analysisData: parsedAnalysis,
    });

    // Reward user with tokens
    const tokenReward = await rewardUserForAnalysis(walletAddress);

    return NextResponse.json<HealthAnalysisResponse>({
      success: true,
      analysis: parsedAnalysis,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      tokenReward: {
        earned: tokenReward.earnedTokens,
        total: tokenReward.totalTokens,
        isNewUser: tokenReward.isNewUser,
      },
    });

  } catch (error: any) {
    console.error('Health analysis error:', error);

    let errorMessage = 'Analiz sırasında bir hata oluştu';
    let errorDetails = error.message;

    if (error.message?.includes('API key')) {
      errorMessage = 'API key hatası';
      errorDetails = 'Gemini API key geçersiz veya eksik';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API kotası aşıldı';
      errorDetails = 'Günlük API kullanım limiti doldu';
    } else if (error.message?.includes('invalid')) {
      errorMessage = 'Geçersiz dosya formatı';
      errorDetails = 'Dosya formatı okunamadı veya bozuk';
    }

    return NextResponse.json<HealthAnalysisResponse>(
      {
        success: false,
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Health analysis API is ready (JSON format only)',
    supportedFileTypes: ALLOWED_FILE_TYPES,
    maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
    responseFormat: 'JSON',
  });
}
