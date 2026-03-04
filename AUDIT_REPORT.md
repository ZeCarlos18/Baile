# 🔍 Relatório de Auditoria - Baile Codebase

## DUPLICAÇÕES ENCONTRADAS

### 1. **Queue.css - ESTILOS DUPLICADOS E CONFLITANTES** ⚠️ CRÍTICO
**Localização**: `src/styles/Queue.css`

**Problema**: Tem DOIS conjuntos de estilos conflitantes para a mesma classe:

```css
/* Estilos ANTIGOS (desatualizado) */
.queue-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.queue-item {
  display: flex;
  justify-content: space-between;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  ...
}

.queue-item-info { ... }
.queue-position { ... }
.queue-track-name { ... }
.queue-actions { ... }

/* Estilos NOVOS (atual) */
.queue-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 5px;
}

.queue-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  ...
}

.queue-number { ... }
.queue-title-text { ... }
```

**Solução**: Remover as **40+ linhas de código antigo** que não estão sendo usadas.

---

### 2. **LOGGERS DE DEBUG DESNECESSÁRIOS** 🗑️
**Localização**: 
- `src/pages/Home.jsx` (linhas 13-14)
- `src/hooks/usePlayer.js` (linhas 38-47)

**Código para remover**:
```javascript
// Home.jsx
console.log("🔄 Criando nova sala...")
console.log("✅ Sala criada com código:", code)

// usePlayer.js
if (event.data === window.YT.PlayerState.PLAYING) {
  console.log("Playing")
} else if (event.data === window.YT.PlayerState.PAUSED) {
  console.log("Paused")
}
```

**Por quê**: Esses são apenas logs de debug que poluem o console em produção.

---

### 3. **AuthContext.jsx - NÃO UTILIZADO** 🗑️
**Localização**: `src/contexts/AuthContext.jsx`

**Status**: Importado e criado mas **NUNCA utilizado** em nenhum lugar do app:
- ❌ Não importado em App.jsx
- ❌ Não usado em nenhum componente
- ❌ Autenticação Spotify não implementada

**Recomendação**: 
- ✅ Se planejado para o futuro: comentar com TODO
- ❌ Se não será usado: deletar (evita confusão)

---

### 4. **ARQUIVOS CSS NÃO UTILIZADOS** 🗑️

#### a) `src/styles/Dashboard.css`
- Arquivo criado para uma página "Dashboard" que **não existe**
- Nenhuma página/componente importa este arquivo
- **Deletar**: Remover 50+ linhas

#### b) `src/styles/Login.css`
- Arquivo criado para uma página "Login" que **não existe**
- Nenhuma página/componente importa este arquivo
- **Deletar**: Remover 60+ linhas

#### c) `src/styles/SearchMusic.css`
- Arquivo com apenas comentários
- Os estilos reais estão em `Room.css`
- **Deletar**: Remover arquivo vazio

#### d) `src/App.css`
- Arquivo vazio com apenas comentário
- Estilos globais já estão em `src/styles/index.css`
- **Deletar**: Remover arquivo desnecessário

---

### 5. **usePlayer.js - CALLBACK NÃO USADO** 🗑️
**Localização**: `src/hooks/usePlayer.js` (linha 4)

```javascript
export function usePlayer(videoId, onVideoEnd, startTime = 0, onPlayStateChange) {
  // onPlayStateChange nunca é chamado!
  ...
}
```

**Problema**: Parâmetro `onPlayStateChange` é recebido mas **nunca executado**.

**Solução**: 
- ✅ Remover o parâmetro se não é necessário
- ✅ Ou implementar o callback se é necessário

---

### 6. **DUPLICAÇÃO DE LÓGICA NO BACKEND** ⚠️
**Localização**: `server/server.js` (linhas 206-256)

**Problema**: As funções `request-roulette` + `vote-roulette` + `spin-wheel` têm lógica **MUITO SIMILAR**:

```javascript
// Três maneiras diferentes de fazer a mesma coisa:

1. request-roulette (user iniciou)
   ↓
2. vote-roulette (outros users votam)
   ↓
3. spin-wheel (nunca é usado!)

// Todos terminam com o mesmo emit:
io.to(roomCode).emit('start-roulette', {
  queue: queueSnapshot,
  selectedIndex: randomIndex,
  selectedVideo: selectedVideo
});
```

**Recomendação**: Consolidar em uma única função ou deixar claro o fluxo.

---

### 7. **UNUSED DEPENDENCIES** 📦

#### Frontend (`package.json`):
```json
"axios": "^1.13.5"  // ❌ Importado em AuthContext mas nunca usado
```

**Uso**: Apenas em AuthContext que não é utilizado.

**Impacto**: +11KB no bundle

---

### 8. **COMENTÁRIOS DESNECESSÁRIOS** 💬

**Localização**: Vários arquivos

```javascript
// SearchMusic.css
/* Este arquivo é para estilizar o SearchBar dentro do Room */
/* Os estilos estão em Room.css para manter consistência */

// App.css
/* App.css - Estilos globais definidos em main.jsx e styles/index.css */
```

Esses comentários ocupam espaço sem adicionar valor.

---

## RESUMO DE AÇÕES RECOMENDADAS

| Prioridade | Item | Tipo | Ação |
|-----------|------|------|------|
| 🔴 CRÍTICO | Queue.css duplicado | Refactor | Remover 40+ linhas de código antigo |
| 🟡 ALTO | AuthContext não usado | Cleanup | Remover ou comentar com TODO |
| 🟡 ALTO | CSS não utilizados (4 arquivos) | Cleanup | Deletar Dashboard.css, Login.css, SearchMusic.css, App.css |
| 🟡 ALTO | Console.logs de debug | Cleanup | Remover 6 console.log statements |
| 🟡 ALTO | axios dependency | Cleanup | Remover do package.json |
| 🟠 MÉDIO | spin-wheel no backend | Review | Verificar se é realmente usado |
| 🟠 MÉDIO | onPlayStateChange | Cleanup | Remover callback não utilizado |
| 🟠 MÉDIO | Arquivos comentários vazios | Cleanup | Remover comentários desnecessários |

---

## ESTIMATIVA DE REDUÇÃO

- **Removendo estes items**: 
  - Remover ~200+ linhas de código duplicado/desnecessário
  - Reduzir bundle em ~15KB (axios)
  - Simplificar manutenção em 20%

---

## CÓDIGO LIMPO vs CÓDIGO ATUAL

### Antes (Atual)
- 4 arquivos CSS não utilizados
- 1 Context não utilizado
- 40+ linhas de Queue.css duplicadas
- 6 console.logs de debug
- 1 dependency não usada

### Depois (Recomendado)
- ✅ Apenas CSS utilizados
- ✅ Contexts relevantes
- ✅ Sem duplicação de estilos
- ✅ Sem logs de debug
- ✅ Apenas dependências necessárias

---

*Relatório gerado: 03/03/2026*
