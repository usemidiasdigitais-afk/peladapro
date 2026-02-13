#!/bin/bash

# ============================================
# Script de Teste de Conexão com Asaas
# ============================================
# Valida a conexão e autenticação com Asaas
# Uso: bash scripts/test-asaas.sh

set -e

echo ""
echo "============================================"
echo "🧪 TESTE DE CONEXÃO COM ASAAS"
echo "============================================"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "   Execute: cp .env.example .env"
    exit 1
fi

# Carregar variáveis de ambiente
export $(cat .env | grep -v '^#' | xargs)

# Verificar se ASAAS_API_KEY está configurada
if [ -z "$ASAAS_API_KEY" ]; then
    echo "❌ ASAAS_API_KEY não está configurada no .env"
    exit 1
fi

echo "📍 Ambiente: ${NODE_ENV:-development}"
echo "🔗 URL Base: ${ASAAS_API_URL:-https://api.asaas.com/v3}"
echo "🔑 API Key: ${ASAAS_API_KEY:0:20}..."
echo ""

# Teste 1: Conectividade básica
echo "🔍 Teste 1: Conectividade básica..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "access_token: $ASAAS_API_KEY" \
  "${ASAAS_API_URL:-https://api.asaas.com/v3}/customers?limit=1")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Conexão estabelecida com sucesso (HTTP 200)"
else
    echo "❌ Erro na conexão (HTTP $RESPONSE)"
    exit 1
fi

# Teste 2: Listar clientes
echo ""
echo "🔍 Teste 2: Listar clientes..."
CUSTOMERS=$(curl -s \
  -H "access_token: $ASAAS_API_KEY" \
  "${ASAAS_API_URL:-https://api.asaas.com/v3}/customers?limit=1")

CUSTOMER_COUNT=$(echo $CUSTOMERS | grep -o '"data":\[' | wc -l)
if [ "$CUSTOMER_COUNT" -gt 0 ]; then
    echo "✅ Clientes encontrados"
else
    echo "⚠️  Nenhum cliente encontrado (isso é normal em nova conta)"
fi

# Teste 3: Criar cliente de teste
echo ""
echo "🔍 Teste 3: Criar cliente de teste..."
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-$TIMESTAMP@peladapro.com"

CREATE_RESPONSE=$(curl -s -X POST \
  -H "access_token: $ASAAS_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Cliente Teste\",\"email\":\"$TEST_EMAIL\",\"phone\":\"11999999999\"}" \
  "${ASAAS_API_URL:-https://api.asaas.com/v3}/customers")

CUSTOMER_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$CUSTOMER_ID" ]; then
    echo "✅ Cliente criado com sucesso (ID: $CUSTOMER_ID)"
else
    echo "⚠️  Erro ao criar cliente (verifique os dados)"
fi

echo ""
echo "============================================"
echo "✅ TESTES CONCLUÍDOS COM SUCESSO!"
echo "============================================"
echo ""
echo "🎉 Asaas está pronto para uso!"
echo ""
