# 📦 Guia de Instalação

Este documento descreve o processo completo para configurar e executar o projeto localmente.

## 📋 Pré-requisitos

Certifique-se de ter instalado:

- Node.js 18 ou superior
- npm 9 ou superior
- Uma chave válida da YouTube Data API v3

## 🔑 Configuração da API do YouTube

Dentro da pasta `Baile/`, crie um arquivo chamado `.env` com o seguinte conteúdo:

VITE_YOUTUBE_API_KEY=SUA_CHAVE_AQUI


Substitua `SUA_CHAVE_AQUI` pela chave gerada no Google Cloud Console.


## 📥 Instalação do Backend

1. Acesse a pasta do backend principal:

```bash
cd server

```
2. Instale as dependências:
npm install

3. Inicie o servidor:
npm start

O servidor será iniciado em:
http://localhost:3000


## 📥Instalação do Frontend

1. Acesse a pasta do frontend:
```bash
cd Baile

```
2. Instale as dependências:
npm install

3. Inicie o servidor de desenvolvimento:
npm run dev