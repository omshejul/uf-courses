import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const school = searchParams.get('school');
    const professor = searchParams.get('professor');

    if (!school || !professor) {
        return NextResponse.json(
            { error: 'School and professor parameters are required' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(
            `https://rmp.theom.app/api/professor?school=${encodeURIComponent(school)}&professor=${encodeURIComponent(professor)}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch professor data');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch  {
        return NextResponse.json(
            { error: 'Failed to fetch professor data' },
            { status: 500 }
        );
    }
} 