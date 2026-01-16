import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        // Parse form data (application/x-www-form-urlencoded)
        const formData = await request.formData();
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        console.log('[Login] Forwarding to backend API:', API_URL);

        // Forward to backend API for real JWT token
        const response = await axios.post(
            `${API_URL}/auth/login`,
            new URLSearchParams({
                username,
                password
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log('[Login] Backend response:', response.status);

        // Return the JWT tokens from backend
        return NextResponse.json({
            success: true,
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            token_type: response.data.token_type || 'Bearer',
            expires_in: response.data.expires_in,
            user: {
                username,
                email: `${username}@hbot.local`
            }
        });

    } catch (error: any) {
        console.error('[Login] Error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            return NextResponse.json(
                { detail: 'Invalid username or password' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { detail: error.response?.data?.detail || error.message },
            { status: error.response?.status || 500 }
        );
    }
}
