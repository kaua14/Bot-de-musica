# Discord Music Bot

Um bot de música para Discord que reproduz áudios do YouTube com uma interface simples e intuitiva.

## 🚀 Funcionalidades

- ▶️ Reproduzir músicas do YouTube
- ⏭️ Pular músicas
- ⏹️ Parar reprodução
- 📋 Visualizar fila de músicas
- 🎵 Interface com embeds bonitos
- 🔄 Reprodução automática da próxima música

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- Conta no Discord
- Servidor Discord com permissões para adicionar bots

## 🛠️ Instalação

1. **Clone ou baixe este projeto**
   ```bash
   git clone <url-do-repositorio>
   cd discord-music-bot
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o token do bot**
   - Copie o arquivo `env.example` para `.env`
   ```bash
   cp env.example .env
   ```
   - Edite o arquivo `.env` e adicione seu token do Discord:
   ```
   DISCORD_BOT_TOKEN=seu_token_aqui
   ```

## 🤖 Como criar um bot no Discord

1. Acesse o [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications)
2. Clique em "New Application" e dê um nome ao seu bot
3. Vá para a aba "Bot" no menu lateral
4. Clique em "Add Bot"
5. Copie o token do bot (mantenha-o seguro!)
6. Na aba "OAuth2" > "URL Generator":
   - Selecione "bot" em Scopes
   - Selecione as permissões: "Send Messages", "Connect", "Speak", "Read Message History"
   - Copie a URL gerada e use-a para adicionar o bot ao seu servidor

## 🎮 Comandos

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `!play <link>` | Toca uma música do YouTube | `!play https://youtube.com/watch?v=...` |
| `!skip` | Pula a música atual | `!skip` |
| `!stop` | Para a música e limpa a fila | `!stop` |
| `!queue` | Mostra a fila de músicas | `!queue` |
| `!help` | Mostra os comandos disponíveis | `!help` |

## 🚀 Executando o bot

```bash
npm start
```

Ou para desenvolvimento:

```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
discord-music-bot/
├── index.js          # Arquivo principal do bot
├── package.json      # Dependências e scripts
├── env.example       # Exemplo de configuração
├── .env              # Suas configurações (criar manualmente)
└── README.md         # Este arquivo
```

## 🔧 Dependências

- **discord.js**: Biblioteca principal para interagir com a API do Discord
- **@discordjs/voice**: Para funcionalidade de áudio/voz
- **ytdl-core**: Para baixar áudio do YouTube
- **ffmpeg-static**: Binários do FFmpeg para processamento de áudio
- **dotenv**: Para gerenciar variáveis de ambiente

## ⚠️ Problemas Comuns

### Bot não consegue conectar ao canal de voz
- Verifique se o bot tem as permissões "Connect" e "Speak"
- Certifique-se de que você está em um canal de voz

### Erro ao reproduzir música
- Verifique se o link do YouTube é válido
- Alguns vídeos podem ter restrições de região

### Bot não responde aos comandos
- Verifique se o token está correto no arquivo `.env`
- Certifique-se de que o bot está online no seu servidor

## 🎯 Funcionalidades Futuras

- [ ] Controle de volume
- [ ] Loop de música
- [ ] Pesquisa por nome (sem link)
- [ ] Playlists
- [ ] Comandos de slash (/) do Discord

## 📝 Licença

Este projeto está sob a licença ISC.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

**Nota**: Este bot é para fins educacionais. Certifique-se de respeitar os termos de uso do YouTube e do Discord.
