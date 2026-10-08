import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const skills = searchParams.get('skills');
    
    // Build query
    const query: any = {};
    if (skills) {
      query.skills = { contains: skills };
    }

    const experts = await prisma.expertProfile.findMany({
      where: query,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        availabilities: {
          where: {
            isBooked: false
          }
        }
      },
    });

    return NextResponse.json({ experts });
  } catch (error) {
    console.error('Error fetching experts:', error);
    return NextResponse.json({ error: 'Failed to fetch experts' }, { status: 500 });
  }
}
