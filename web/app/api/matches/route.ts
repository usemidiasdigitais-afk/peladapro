import { NextRequest, NextResponse } from 'next/server'

// Configuração do Supabase
const SUPABASE_URL = 'https://qtwduwqmewpktaemjqxw.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0d2R1d3FlbXdwd2t0YWVtanF4dyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM3ODk4OTc5LCJleHAiOjIwNTM0NzQ5Nzl9.EXAMPLE'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados
    if (!body.date || !body.location || body.match_cost === undefined) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Conectar ao Supabase e inserir partida
    const groupId = body.group_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    const createdBy = body.created_by || 'a47ac10b-58cc-4372-a567-0e02b2c3d479'
    
    console.log('Criando partida com group_id:', groupId, 'created_by:', createdBy)
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        group_id: groupId,
        created_by: createdBy,
        sport: body.sport || 'FOOTBALL',
        location: body.location,
        match_date: body.date,
        match_cost: parseFloat(body.match_cost),
        max_players: parseInt(body.max_players) || 11,
        status: 'SCHEDULED',
        notes: body.notes || '',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro do Supabase:', error)
      return NextResponse.json(
        { error: 'Erro ao criar partida no Supabase', details: error },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Partida criada com sucesso:', data)
    return NextResponse.json(data[0] || data)
  } catch (error) {
    console.error('Erro ao criar partida:', error)
    return NextResponse.json(
      { error: 'Erro ao criar partida', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Obter group_id da query string
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')

    // Construir query
    let query = `${SUPABASE_URL}/rest/v1/matches?select=*&order=match_date.desc`
    
    if (groupId) {
      query += `&group_id=eq.${encodeURIComponent(groupId)}`
    }

    // Buscar partidas do Supabase
    const response = await fetch(query, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro do Supabase:', error)
      throw new Error(`Supabase error: ${response.status}`)
    }

    const matches = await response.json()

    // Formatar resposta
    return NextResponse.json(
      matches.map((match: any) => ({
        id: match.id,
        sport: match.sport,
        location: match.location,
        match_date: match.match_date,
        match_cost: match.match_cost,
        max_players: match.max_players,
        status: match.status,
      }))
    )
  } catch (error) {
    console.error('Erro ao buscar partidas:', error)
    
    // Retornar array vazio em caso de erro
    return NextResponse.json([])
  }
}
