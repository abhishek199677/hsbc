import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, expertId, serviceId, availabilityId, meetingLink } = body;

    // Validate request
    if (!userId || !expertId || !serviceId || !availabilityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Mark availability as booked
    await prisma.availability.update({
      where: { id: availabilityId },
      data: { isBooked: true },
    });

    // 2. Fetch the service to get the type and duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // 3. Create the interview (booking)
    const interview = await prisma.interview.create({
      data: {
        userId,
        expertId,
        serviceId,
        date: new Date().toISOString().split('T')[0], // Placeholder, should derive from availability
        time: "10:00", // Placeholder
        mode: "Expert 1:1 Interview",
        type: service.type,
        duration: service.duration,
        meetingLink: meetingLink || "https://livekit.example.com/room", // Simplified
        status: "scheduled"
      },
    });

    return NextResponse.json({ interview });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
