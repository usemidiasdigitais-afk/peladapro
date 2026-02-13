import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const path = body.path || '/dashboard'

    // Revalidar o caminho
    revalidatePath(path)

    return NextResponse.json({
      success: true,
      message: `Cache revalidado para ${path}`,
    })
  } catch (error) {
    console.error('Erro ao revalidar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao revalidar cache' },
      { status: 500 }
    )
  }
}
