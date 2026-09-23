// Tempo que um sorteio fica aberto esperando alguém escolher uma carta
export const DRAW_DURATION_MS = 30_000

// Se ninguém escolher a tempo e não houver música tocando, o servidor
// escolhe uma carta aleatória para a festa não parar. `false` desliga.
export const AUTO_PICK_ON_EXPIRE = true

// Atraso entre a escolha da carta e o início da música. Dá tempo para a
// animação de revelação terminar e para todos os clientes carregarem o vídeo.
export const START_DELAY_MS = 3_000

// Quanto tempo uma sala sem ninguém conectado é mantida antes de ser apagada
export const EMPTY_ROOM_TTL_MS = 10_000

export const ROOM_CODE_LENGTH = 6
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
