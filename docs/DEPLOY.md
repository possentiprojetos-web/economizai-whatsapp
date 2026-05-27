# FinBot WhatsApp — Guia de Deploy Completo

## Visão Geral
Stack 100% gratuita:
- **WhatsApp**: Meta Cloud API (1.000 conversas/mês grátis)
- **IA**: Google Gemini 1.5 Flash (free tier)
- **Banco**: Supabase (free tier)
- **Hospedagem**: Render.com (free tier)

---

## PASSO 1 — Supabase (banco de dados)

1. Acesse https://supabase.com e crie conta
2. Clique em **New Project** → defina nome "finbot" e senha forte
3. Aguarde ~2 min o projeto subir
4. Vá em **SQL Editor** → **New Query**
5. Cole o conteúdo de `docs/supabase_schema.sql` e clique **Run**
6. Vá em **Project Settings > API**
7. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_KEY`

---

## PASSO 2 — Google Gemini API

1. Acesse https://aistudio.google.com/app/apikey
2. Clique **Create API Key**
3. Selecione "Create in new project"
4. Copie a chave → `GEMINI_API_KEY`

> Limite free: 15 requisições/minuto, 1 milhão tokens/dia — suficiente para centenas de usuários.

---

## PASSO 3 — Meta for Developers (WhatsApp)

### 3.1 Criar conta e app
1. Acesse https://developers.facebook.com
2. Clique **My Apps > Create App**
3. Selecione **Business** → próximo
4. Nome do app: "FinBot" → **Create App**

### 3.2 Adicionar produto WhatsApp
1. No painel do app, clique **Add Product**
2. Encontre **WhatsApp** → clique **Set Up**
3. Vá em **WhatsApp > API Setup**

### 3.3 Número de teste
1. Em **From**, você verá um número de teste gratuito
2. Em **To**, coloque seu WhatsApp para testar
3. Clique **Send Message** — você receberá uma mensagem de teste
4. Copie o **Phone Number ID** → `PHONE_NUMBER_ID`

### 3.4 Token de acesso
1. Em **API Setup**, clique em **Generate token** (ou use o token temporário para testes)
2. Para produção: vá em **System Users** no Meta Business → crie um System User → gere token permanente com permissão `whatsapp_business_messaging`
3. Copie o token → `WA_TOKEN`

---

## PASSO 4 — Deploy no Render.com

1. Crie conta em https://render.com
2. Faça upload do projeto no GitHub (crie repo público ou privado)
3. No Render: **New > Web Service**
4. Conecte o repositório GitHub
5. Configure:
   - **Name**: finbot-whatsapp
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
6. Em **Environment Variables**, adicione todas as variáveis do `.env.example`
7. Clique **Create Web Service**
8. Aguarde o deploy (~3 min)
9. Copie a URL gerada: `https://finbot-whatsapp.onrender.com`

---

## PASSO 5 — Configurar Webhook no Meta

1. Volte no Meta for Developers → seu app → **WhatsApp > Configuration**
2. Em **Webhook**, clique **Edit**
3. **Callback URL**: `https://finbot-whatsapp.onrender.com/webhook`
4. **Verify Token**: o mesmo valor que você colocou em `WEBHOOK_VERIFY_TOKEN`
5. Clique **Verify and Save**
6. Em **Webhook Fields**, ative `messages`
7. Clique **Subscribe**

---

## PASSO 6 — Teste Final

Envie para o número de teste:
- "oi" → deve receber a mensagem de boas-vindas
- "meu orçamento é 3000" → define orçamento
- "gastei 50 no uber" → registra gasto
- "ver meus gastos" → mostra resumo
- "como funciona juros compostos?" → dica educacional

---

## Para número permanente (produção)

1. No Meta Business Manager, adicione um número de chip real
2. Verifique o número via SMS
3. Solicite o limite de conversas (começa em 250/dia, aumenta automaticamente)
4. Crie template de mensagem para iniciar conversas ativas

---

## Troubleshooting

**Webhook não verifica**: Verifique se `WEBHOOK_VERIFY_TOKEN` no Render é igual ao digitado no Meta.

**Mensagens não chegam**: Verifique se o campo `messages` está ativo em Webhook Fields.

**Erro de banco**: Confirme que rodou o SQL no Supabase e que `SUPABASE_URL` e `SUPABASE_KEY` estão corretos.

**Render dorme após 15min** (free tier): Use https://uptimerobot.com para fazer ping a cada 5 min e manter online.
