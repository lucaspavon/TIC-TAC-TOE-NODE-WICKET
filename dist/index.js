"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const http = __importStar(require("http"));
const socket_io_1 = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
const games = {};
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
        }
        else {
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
