#!/bin/bash

# Script de instalação do Sistema de Suporte ChatGuru
# Execute: chmod +x setup.sh && ./setup.sh

set -e  # Parar em caso de erro

echo "🚀 Instalando Sistema de Suporte ChatGuru..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Node.js
echo -e "${BLUE}[1/5]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js não encontrado. Por favor, instale Node.js 18+ primeiro.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js encontrado: ${NODE_VERSION}"
echo ""

# 2. Instalar dependências
echo -e "${BLUE}[2/5]${NC} Instalando dependências..."
npm install
echo -e "${GREEN}✓${NC} Dependências instaladas"
echo ""

# 3. Verificar/Criar .env.local
echo -e "${BLUE}[3/5]${NC} Configurando variáveis de ambiente..."
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local não encontrado. Criando a partir do exemplo...${NC}"
    cp .env.local.example .env.local
    echo -e "${GREEN}✓${NC} .env.local criado"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite .env.local e adicione sua OPENAI_API_KEY real!${NC}"
    echo -e "${YELLOW}   Obtenha sua chave em: https://platform.openai.com/api-keys${NC}"
    echo ""
else
    echo -e "${GREEN}✓${NC} .env.local já existe"
fi
echo ""

# 4. Verificar estrutura de pastas
echo -e "${BLUE}[4/5]${NC} Verificando estrutura do projeto..."

if [ ! -d "api" ]; then
    echo -e "${YELLOW}⚠️  Pasta /api não encontrada. Criando...${NC}"
    mkdir -p api
fi

if [ ! -d "src/services" ]; then
    echo -e "${YELLOW}⚠️  Pasta /src/services não encontrada. Criando...${NC}"
    mkdir -p src/services
fi

if [ ! -d "examples" ]; then
    echo -e "${YELLOW}⚠️  Pasta /examples não encontrada. Criando...${NC}"
    mkdir -p examples
fi

# Verificar arquivos essenciais
FILES_TO_CHECK=(
    "api/support-router.ts"
    "src/services/session.ts"
    "src/services/supportRouter.ts"
    "components/TestChat.tsx"
)

MISSING_FILES=0
for file in "${FILES_TO_CHECK[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  Arquivo ausente: $file${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Todos os arquivos essenciais presentes"
else
    echo -e "${YELLOW}⚠️  $MISSING_FILES arquivo(s) ausente(s). Verifique a estrutura do projeto.${NC}"
fi
echo ""

# 5. Executar testes
echo -e "${BLUE}[5/5]${NC} Executando testes..."
if npm test -- --run 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Testes passaram com sucesso"
else
    echo -e "${YELLOW}⚠️  Alguns testes falharam. Revise os logs acima.${NC}"
fi
echo ""

# Resumo final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Instalação concluída!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure sua OPENAI_API_KEY no arquivo .env.local:"
echo -e "   ${BLUE}nano .env.local${NC}"
echo ""
echo "2. Para desenvolvimento local:"
echo -e "   ${BLUE}npm run dev${NC}"
echo "   Acesse: http://localhost:5173"
echo ""
echo "3. Para testar endpoints serverless localmente:"
echo -e "   ${BLUE}vercel dev${NC}"
echo "   (requer: npm install -g vercel)"
echo ""
echo "4. Para deploy na Vercel:"
echo -e "   ${BLUE}vercel --prod${NC}"
echo "   ou use o Dashboard: https://vercel.com/dashboard"
echo ""
echo "📚 Documentação:"
echo "   • Quick Start:    QUICKSTART.md"
echo "   • Sistema:        SUPPORT_SYSTEM.md"
echo "   • Deploy:         DEPLOY_GUIDE.md"
echo "   • Exemplos:       examples/SupportIntegration.tsx"
echo ""
echo -e "${GREEN}Pronto para usar! 🎉${NC}"
echo ""
