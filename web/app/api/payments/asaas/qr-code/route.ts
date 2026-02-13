import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, amount, playerEmail } = body

    // Validar dados
    if (!paymentId || !amount || !playerEmail) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Aqui você conectaria à API Asaas
    // const asaasResponse = await fetch('https://api.asaas.com/v3/pix/qr-codes', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'access_token': process.env.ASAAS_API_KEY,
    //   },
    //   body: JSON.stringify({
    //     format: 'ALL',
    //     amount: amount,
    //     description: `Pagamento de partida - ${playerEmail}`,
    //   }),
    // })

    // Simular resposta do Asaas
    const qrCode = `00020126580014br.gov.bcb.pix0136${paymentId}520400005303986540510.00${amount}5802BR5913Pelada Pro6009Sao Paulo62410503***63041D3D`
    const asaasId = `pay_${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      qrCode,
      asaasId,
      amount,
      playerEmail,
      expiresIn: 3600, // 1 hora
    })
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar QR Code PIX' },
      { status: 500 }
    )
  }
}
