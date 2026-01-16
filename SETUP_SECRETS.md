# 🔐 Guia de Configuração de Secrets do GitHub

Este documento explica como configurar os secrets necessários para os workflows funcionarem corretamente.

## 📍 Onde Configurar

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**

---

## 🔑 Secrets Necessários

### Secrets Existentes (verificar se já estão configurados)

#### AWS Credentials
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```
**Onde encontrar:** AWS IAM Console → Users → Security credentials

#### S3 Buckets
```
AWS_S3_BUCKET=gameswipe-production
STAGING_S3_BUCKET=gameswipe-staging
```
**Onde encontrar:** Terraform outputs ou AWS S3 Console

#### CloudFront Distribution IDs
```
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
STAGING_CLOUDFRONT_ID=E0987654321XYZ
```
**Onde encontrar:** AWS CloudFront Console ou Terraform outputs

---

### Secrets NOVOS (adicionar agora)

#### 1. Supabase URL
```
Name: VITE_SUPABASE_URL
Value: https://ospvpdmpjznebrsxdgdd.supabase.co
```
**Onde encontrar:** Supabase Dashboard → Project Settings → API

#### 2. Supabase Anon Key
```
Name: VITE_SUPABASE_ANON_KEY
Value: sb_publishable_p1GzHw_kM_paC3HDn6FRew_4Npkc5cP
```
**Onde encontrar:** Supabase Dashboard → Project Settings → API → anon/public key

#### 3. RAWG API Key
```
Name: VITE_RAWG_API_KEY
Value: 2c7e3f25ecf94628b569cc0f91d6e5f3
```
**Onde encontrar:** https://rawg.io/apidocs → Get API Key

#### 4. CloudFront Domain (Production)
```
Name: CLOUDFRONT_DOMAIN
Value: d1os8kgh3lqb33.cloudfront.net
```
**Onde encontrar:** AWS CloudFront Console → Distribution → Domain Name

#### 5. CloudFront Domain (Staging)
```
Name: STAGING_CLOUDFRONT_DOMAIN
Value: dpx34hhrgvpq3.cloudfront.net
```
**Onde encontrar:** AWS CloudFront Console → Distribution → Domain Name

---

## ✅ Checklist de Configuração

Marque conforme for adicionando:

### Secrets AWS (devem existir)
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_S3_BUCKET`
- [ ] `STAGING_S3_BUCKET`
- [ ] `CLOUDFRONT_DISTRIBUTION_ID`
- [ ] `STAGING_CLOUDFRONT_ID`

### Secrets Novos (adicionar)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_RAWG_API_KEY`
- [ ] `CLOUDFRONT_DOMAIN`
- [ ] `STAGING_CLOUDFRONT_DOMAIN`

---

## 🧪 Como Testar se Está Funcionando

### 1. Verificar Secrets Configurados
Na página de Secrets do GitHub, você deve ver todos os 11 secrets listados.

### 2. Testar Workflow CI
```bash
# Faça um commit em uma branch e abra um PR
git checkout -b test/secrets-setup
git commit --allow-empty -m "test: verificar secrets"
git push origin test/secrets-setup
```

O workflow CI deve executar sem erros de variáveis de ambiente.

### 3. Testar Build Local
```bash
# Configure o .env local
cp .env.example .env

# Edite .env com as credenciais
nano .env  # ou use seu editor preferido

# Rode o build
npm run build

# Deve completar sem erros
```

---

## 🚨 Segurança

### ⚠️ IMPORTANTE
- Nunca commite o arquivo `.env` no git (já está no .gitignore)
- Nunca compartilhe suas API keys publicamente
- Os secrets do GitHub são criptografados e só visíveis para admin do repo

### 🔄 Rotação de Secrets
Recomendado rodar secrets a cada 90 dias:
1. Gerar nova API key no serviço
2. Atualizar secret no GitHub
3. Atualizar `.env` local
4. Testar deploy

---

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"
**Causa:** Secret não configurado ou nome errado
**Solução:**
1. Verifique o nome exato do secret (case-sensitive)
2. Certifique que o valor está correto
3. Re-rode o workflow

### Erro: Build falha em GitHub Actions
**Causa:** Secrets não acessíveis pelo workflow
**Solução:**
1. Verifique se os secrets estão em "Repository secrets" (não Environment secrets)
2. Confirme que o workflow tem permissão de leitura
3. Re-execute o workflow

### Build local funciona, mas CI falha
**Causa:** Secrets diferentes entre local e GitHub
**Solução:**
1. Compare valores do `.env` com GitHub secrets
2. Certifique que todos os secrets estão configurados
3. Verifique se o workflow está injetando as variáveis corretamente:
```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
  VITE_RAWG_API_KEY: ${{ secrets.VITE_RAWG_API_KEY }}
```

---

## 📝 Referências

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase API Settings](https://supabase.com/docs/guides/api)
- [RAWG API Docs](https://rawg.io/apidocs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## ✅ Pós-Configuração

Depois de configurar todos os secrets:

1. **Teste o CI workflow:**
   - Abra um PR
   - Verifique se o CI passa

2. **Teste o Deploy Staging:**
   - Faça push para branch `develop`
   - Aguarde deploy automático
   - Acesse o site de staging

3. **Teste o Deploy Production:**
   - Faça merge para `main`
   - Aguarde deploy automático
   - Acesse o site de produção

Se todos os passos funcionarem, a configuração está completa! 🎉
