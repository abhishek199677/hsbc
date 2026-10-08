import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const availabilities = await prisma.availability.findMany({
      where: {
        expertId: params.id,
        isBooked: false,
      },
    });

    return NextResponse.json({ availabilities });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
