import express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const games: any = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join_game', ({ playerName, room }) => {
    socket.join(room);
    console.log(`${playerName} joined room ${room}`);

    if (!games[room]) {
      games[room] = {
        players: {},
        board: Array(9).fill(null),
        turn: 'X',
      };
    }

    const game = games[room];
    const playerSymbol = Object.keys(game.players).length === 0 ? 'X' : 'O';
    game.players[socket.id] = { name: playerName, symbol: playerSymbol };

    socket.emit('player_assign', playerSymbol);
    io.to(room).emit('game_update', game);

    if (Object.keys(game.players).length === 2) {
      io.to(room).emit('game_start');
    }
  });

  socket.on('make_move', ({ room, index }) => {
    const game = games[room];
    const player = game.players[socket.id];

    if (game.turn === player.symbol && !game.board[index]) {
      game.board[index] = player.symbol;
      game.turn = game.turn === 'X' ? 'O' : 'X';
      io.to(room).emit('game_update', game);
    } else {
      socket.emit('invalid_move', 'Invalid move');
    }
  });

  socket.on('chat_message', ({ room, message }) => {
    io.to(room).emit('chat_message', message);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    for (const room in games) {
      const game = games[room];
      if (game.players[socket.id]) {
        delete game.players[socket.id];
        io.to(room).emit('game_update', game);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
