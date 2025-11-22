import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User, { IUser } from '@/lib/models/User';
import HealthAnalysis, { IHealthAnalysis } from '@/lib/models/HealthAnalysis';
import { DashboardResponse, DashboardReport } from '@/types/health';

export async function GET(request: Request) {
  try {
    // Connect to database
    await dbConnect();

    // Get wallet address from query params
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json<DashboardResponse>(
        {
          success: false,
          error: 'Wallet address is required',
          details: 'Please provide a valid wallet address as a query parameter',
        },
        { status: 400 }
      );
    }

    // Normalize wallet address (trim, keep original case for HealthAnalysis)
    const trimmedAddress = walletAddress.trim();
    const normalizedAddress = trimmedAddress.toLowerCase();

    // Find or create user (User model uses lowercase)
    let user = await User.findOne({ walletAddress: normalizedAddress });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        walletAddress: normalizedAddress,
        tokens: 0,
        totalAnalyses: 0,
      });
    }

    // Get all health analysis reports for this user (case-insensitive search)
    // Escape special regex characters in wallet address
    const escapedAddress = trimmedAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reports = await HealthAnalysis.find({
      walletAddress: { $regex: new RegExp(`^${escapedAddress}$`, 'i') }
    })
      .sort({ createdAt: -1 }) // Most recent first
      .lean<IHealthAnalysis[]>();

    // Calculate stats
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const reportsThisMonth = reports.filter(
      (report) => new Date(report.createdAt) >= oneMonthAgo
    ).length;

    const reportsThisWeek = reports.filter(
      (report) => new Date(report.createdAt) >= oneWeekAgo
    ).length;

    // Format reports for response - JSON format only
    // The health analysis system now exclusively uses JSON format with enhanced fields:
    // - title: AI-generated descriptive title
    // - detailedAnalysis: In-depth analysis (200+ words)
    // - medicalContext: Educational information (150+ words)
    // - riskAssessment: Structured risk evaluation
    // - recommendations: Categorized by Immediate Actions, Lifestyle Modifications, Follow-up Care
    const formattedReports: DashboardReport[] = reports.map((report) => ({
      id: String(report._id),
      fileName: report.fileName,
      fileSize: report.fileSize,
      fileType: report.fileType,
      format: 'json', // Always JSON - markdown format has been deprecated
      createdAt: report.createdAt instanceof Date
        ? report.createdAt.toISOString()
        : new Date(report.createdAt).toISOString(),
      updatedAt: report.updatedAt instanceof Date
        ? report.updatedAt.toISOString()
        : new Date(report.updatedAt).toISOString(),
      // Include enhanced analysis data with all new fields
      // Note: Legacy records may have markdown format, but we only expose analysisData
      analysisData: report.analysisData,
    }));

    // Return dashboard data
    return NextResponse.json<DashboardResponse>({
      success: true,
      data: {
        user: {
          walletAddress: user.walletAddress,
          tokens: user.tokens,
          totalAnalyses: user.totalAnalyses,
          lastAnalysisDate: user.lastAnalysisDate
            ? (user.lastAnalysisDate instanceof Date
                ? user.lastAnalysisDate.toISOString()
                : new Date(user.lastAnalysisDate).toISOString())
            : undefined,
          memberSince: user.createdAt instanceof Date
            ? user.createdAt.toISOString()
            : new Date(user.createdAt).toISOString(),
        },
        reports: formattedReports,
        stats: {
          totalReports: reports.length,
          reportsThisMonth,
          reportsThisWeek,
        },
      },
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);

    let errorMessage = 'An error occurred while fetching dashboard data';
    let errorDetails = error.message;

    if (error.name === 'CastError') {
      errorMessage = 'Invalid wallet address format';
      errorDetails = 'The provided wallet address is not valid';
    } else if (error.message?.includes('connection')) {
      errorMessage = 'Database connection error';
      errorDetails = 'Could not connect to the database';
    }

    return NextResponse.json<DashboardResponse>(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
