import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH — update a task (complete or edit)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { isCompleted, title, description, scheduledTime, recurrence, category, difficulty } = body

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(isCompleted !== undefined && {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(scheduledTime && { scheduledTime }),
        ...(recurrence && { recurrence }),
        ...(category && { category }),
        ...(difficulty && { difficulty }),
      },
    })

    // Log completion
    if (isCompleted !== undefined) {
      await prisma.taskLog.create({
        data: {
          taskId: id,
          status: isCompleted ? 'done' : 'snoozed',
        },
      })
    }

    return NextResponse.json({ success: true, task: updated })
  } catch (error) {
    console.error('Task PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE — remove a task
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
