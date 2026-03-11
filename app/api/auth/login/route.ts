import { NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || process.env.NEXORA_API_URL || 'http://localhost:8888';

export async function POST(request: Request) {
    console.log('[Login] --- Authentication Request ---');
    console.log('[Login] HUMMINGBOT_API_URL env:', process.env.HUMMINGBOT_API_URL ? 'PRESENT' : 'MISSING');
    console.log('[Login] NEXORA_API_URL env:', process.env.NEXORA_API_URL ? 'PRESENT' : 'MISSING');
    console.log('[Login] Using API_URL:', API_URL);

    try {
        let username = '';
        let password = '';

        // Attempt to parse JSON first, fallback to form data
        const contentTypeHeader = request.headers.get('content-type') || '';
        
        if (contentTypeHeader.includes('application/json')) {
            const body = await request.json();
            username = body.username;
            password = body.password;
        } else {
            const formData = await request.formData();
            username = formData.get('username') as string;
            password = formData.get('password') as string;
        }

        if (!username || !password) {
            return NextResponse.json(
                { detail: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Forward to Nexora Bot API for real JWT token using fetch (native Next.js)
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('[Login] Backend response status:', response.status);

        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            
            if (!response.ok) {
                return NextResponse.json(
                    { detail: data.detail || 'Login failed' },
                    { status: response.status }
                );
            }
        } else {
            const errorText = await response.text();
            console.error('[Login] Backend returned non-JSON response:', errorText);
            return NextResponse.json(
                { detail: `Backend Error (${response.status}): ${errorText.substring(0, 100)}` },
                { status: response.status || 500 }
            );
        }

        // Return the JWT tokens from backend
        return NextResponse.json({
            success: true,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            token_type: data.token_type || 'Bearer',
            expires_in: data.expires_in,
            user: {
                username,
                email: `${username}@hbot.local`
            }
        });

    } catch (error: any) {
        console.error('[Login] Runtime Error:', error.message);

        return NextResponse.json(
            { detail: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
