require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ffmpegStatic = require('ffmpeg-static'); // Importa ffmpeg-static
const search = require('youtube-search-without-api-key'); // Para pesquisar no YouTube

// Configure ffmpeg para ytdl-core (isto é importante!)
process.env.YTDL_NO_UPDATE = 'true'; // Evita a atualização automática que pode causar problemas
ytdl.setFfmpegPath(ffmpegStatic); // Define o caminho do FFmpeg

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates // Necessário para ver o estado de voz
    ]
});

const prefix = '!';
const queue = new Map(); // Fila de músicas para cada guild (servidor)

client.once('ready', () => {
    console.log('Bot de música está online!');
    console.log(`Conectado como: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'play') {
        // Verifica se é uma seleção de pesquisa
        if (args[0] && !isNaN(args[0]) && global.searchResults && global.searchResults.has(message.author.id)) {
            const searchResults = global.searchResults.get(message.author.id);
            const selectedIndex = parseInt(args[0]) - 1;
            
            if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                const selectedVideo = searchResults[selectedIndex];
                // Simula uma mensagem com o link do vídeo
                message.content = `!play ${selectedVideo.url}`;
                global.searchResults.delete(message.author.id);
                execute(message, serverQueue);
                return;
            } else {
                return message.channel.send('❌ Número inválido! Escolha um número entre 1 e ' + searchResults.length);
            }
        }
        execute(message, serverQueue);
        return;
    } else if (command === 'search') {
        searchMusic(message, serverQueue);
        return;
    } else if (command === 'skip') {
        skip(message, serverQueue);
        return;
    } else if (command === 'stop') {
        stop(message, serverQueue);
        return;
    } else if (command === 'queue') {
        showQueue(message, serverQueue);
        return;
    } else if (command === 'help') {
        showHelp(message);
        return;
    } else {
        message.channel.send('Você precisa especificar um comando válido! Use `!help` para ver os comandos disponíveis.');
    }
});

async function execute(message, serverQueue) {
    const args = message.content.split(' ');
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
        return message.channel.send('Você precisa estar em um canal de voz para tocar música!');
    }
    
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send('Preciso de permissões para entrar e falar no seu canal de voz!');
    }

    if (!args[1]) {
        return message.channel.send('Por favor, forneça um link do YouTube ou use `!search <nome da música>` para pesquisar!');
    }

    let videoUrl = args[1];
    
    // Se não for um link do YouTube, trata como pesquisa
    if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
        const searchQuery = args.slice(1).join(' ');
        try {
            const results = await search(searchQuery);
            if (results.length === 0) {
                return message.channel.send('❌ Nenhum resultado encontrado para sua pesquisa!');
            }
            videoUrl = results[0].url;
            message.channel.send(`🔍 Encontrei: **${results[0].title}**`);
        } catch (error) {
            console.error('Erro na pesquisa:', error);
            return message.channel.send('❌ Erro ao pesquisar no YouTube!');
        }
    }

    try {
        const songInfo = await ytdl.getInfo(videoUrl);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            duration: songInfo.videoDetails.lengthSeconds,
            thumbnail: songInfo.videoDetails.thumbnails[0].url
        };

        if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                player: null,
                songs: [],
                volume: 5,
                playing: true,
            };

            queue.set(message.guild.id, queueContruct);
            queueContruct.songs.push(song);

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });
                queueContruct.connection = connection;
                queueContruct.player = createAudioPlayer();
                connection.subscribe(queueContruct.player);

                play(message.guild, queueContruct.songs[0]);
            } catch (err) {
                console.log(err);
                queue.delete(message.guild.id);
                return message.channel.send('Erro ao conectar ao canal de voz!');
            }
        } else {
            serverQueue.songs.push(song);
            return message.channel.send(`🎵 **${song.title}** foi adicionada à fila!`);
        }
    } catch (error) {
        console.error('Erro ao obter informações do vídeo:', error);
        return message.channel.send('Erro ao processar o link do YouTube. Verifique se o link é válido!');
    }
}

async function searchMusic(message, serverQueue) {
    const args = message.content.split(' ');
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
        return message.channel.send('Você precisa estar em um canal de voz para tocar música!');
    }
    
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send('Preciso de permissões para entrar e falar no seu canal de voz!');
    }

    if (!args[1]) {
        return message.channel.send('Por favor, forneça o nome da música para pesquisar!');
    }

    const searchQuery = args.slice(1).join(' ');
    
    try {
        message.channel.send('🔍 Pesquisando...');
        const results = await search(searchQuery);
        
        if (results.length === 0) {
            return message.channel.send('❌ Nenhum resultado encontrado para sua pesquisa!');
        }

        // Mostra os primeiros 5 resultados
        const embed = {
            color: 0x0099ff,
            title: '🔍 Resultados da Pesquisa',
            description: 'Escolha uma música digitando o número:',
            fields: results.slice(0, 5).map((result, index) => ({
                name: `${index + 1}. ${result.title}`,
                value: `Duração: ${result.duration || 'Desconhecida'}`,
                inline: false
            })),
            footer: {
                text: 'Digite !play <número> para escolher uma música'
            }
        };

        const searchMessage = await message.channel.send({ embeds: [embed] });
        
        // Armazena os resultados temporariamente para seleção
        if (!global.searchResults) global.searchResults = new Map();
        global.searchResults.set(message.author.id, results.slice(0, 5));
        
        // Remove os resultados após 30 segundos
        setTimeout(() => {
            global.searchResults.delete(message.author.id);
        }, 30000);

    } catch (error) {
        console.error('Erro na pesquisa:', error);
        return message.channel.send('❌ Erro ao pesquisar no YouTube!');
    }
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        if (serverQueue.connection) {
            serverQueue.connection.destroy();
        }
        queue.delete(guild.id);
        return;
    }

    try {
        const stream = ytdl(song.url, { 
            filter: 'audioonly',
            highWaterMark: 1 << 25,
            quality: 'highestaudio'
        });
        const resource = createAudioResource(stream);

        serverQueue.player.play(resource);

        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        });

        serverQueue.player.on('error', error => {
            console.error('Erro no player de áudio:', error);
            serverQueue.textChannel.send(`❌ Ocorreu um erro ao tocar a música: ${error.message}`);
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        });

        const embed = {
            color: 0x00ff00,
            title: '🎵 Tocando agora',
            description: `**${song.title}**`,
            thumbnail: {
                url: song.thumbnail
            },
            fields: [
                {
                    name: 'Duração',
                    value: formatDuration(song.duration),
                    inline: true
                },
                {
                    name: 'Posição na fila',
                    value: `1 de ${serverQueue.songs.length}`,
                    inline: true
                }
            ]
        };

        serverQueue.textChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Erro ao reproduzir música:', error);
        serverQueue.textChannel.send('❌ Erro ao reproduzir a música!');
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    }
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('Você precisa estar em um canal de voz para pular a música!');
    }
    if (!serverQueue) {
        return message.channel.send('Não há músicas para pular!');
    }
    serverQueue.player.stop();
    message.channel.send('⏭️ Música pulada!');
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('Você precisa estar em um canal de voz para parar a música!');
    }
    if (!serverQueue) {
        return message.channel.send('Não há músicas para parar!');
    }

    serverQueue.songs = [];
    if (serverQueue.player) {
        serverQueue.player.stop();
    }
    if (serverQueue.connection) {
        serverQueue.connection.destroy();
    }
    queue.delete(message.guild.id);
    message.channel.send('⏹️ Bot parado e fila limpa!');
}

function showQueue(message, serverQueue) {
    if (!serverQueue || serverQueue.songs.length === 0) {
        return message.channel.send('A fila está vazia!');
    }

    const queueList = serverQueue.songs.map((song, index) => 
        `${index + 1}. **${song.title}**`
    ).join('\n');

    const embed = {
        color: 0x0099ff,
        title: '📋 Fila de Músicas',
        description: queueList,
        footer: {
            text: `Total: ${serverQueue.songs.length} música(s)`
        }
    };

    message.channel.send({ embeds: [embed] });
}

function showHelp(message) {
    const embed = {
        color: 0x0099ff,
        title: '🎵 Comandos do Bot de Música',
        description: 'Aqui estão todos os comandos disponíveis:',
        fields: [
            {
                name: '!play <link_do_youtube>',
                value: 'Toca uma música do YouTube usando link direto',
                inline: false
            },
            {
                name: '!play <nome_da_música>',
                value: 'Pesquisa e toca uma música automaticamente',
                inline: false
            },
            {
                name: '!search <nome_da_música>',
                value: 'Pesquisa músicas e mostra opções para escolher',
                inline: false
            },
            {
                name: '!play <número>',
                value: 'Escolhe uma música da pesquisa anterior (1-5)',
                inline: false
            },
            {
                name: '!skip',
                value: 'Pula a música atual',
                inline: false
            },
            {
                name: '!stop',
                value: 'Para a música e limpa a fila',
                inline: false
            },
            {
                name: '!queue',
                value: 'Mostra a fila de músicas',
                inline: false
            },
            {
                name: '!help',
                value: 'Mostra esta mensagem de ajuda',
                inline: false
            }
        ],
        footer: {
            text: 'Certifique-se de estar em um canal de voz para usar os comandos!'
        }
    };

    message.channel.send({ embeds: [embed] });
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', error => {
    console.error('Erro não tratado:', error);
});

process.on('uncaughtException', error => {
    console.error('Exceção não capturada:', error);
});

client.login(process.env.DISCORD_BOT_TOKEN);
