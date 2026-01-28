
import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';

/**
 * GET /api/backtesting/[jobId]/results
 * Get backtest results
 */
export async function GET(
    request: Request,
    { params }: { params: { jobId: string } }
) {
    try {
        const response = await axios.get(
            `${API_URL}/api/backtesting/${params.jobId}/results`
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[Backtesting Results] Error:', error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data?.detail || error.message },
            { status: error.response?.status || 500 }
        );
    }
}
