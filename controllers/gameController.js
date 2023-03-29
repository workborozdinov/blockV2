import moment from 'moment';
import axios from 'axios';
import md5 from 'md5';
import winston from 'winston';
import { Player } from '../models/Player.js';
import { Room } from '../models/Room.js';
import MessageTypes from '../enum/MessageTypes.js';
import { EventEmitter  } from "events";
import SystemEvents from '../enum/SystemEvents.js';
import { CustomDB } from '../modules/CustomDB.js';

const game_id= '908802';
const secret_key= 'w4tvp5GKPrb1X8Uf3hsSLCDzPDPMx9';

const rooms = new Map();
const systemEmitter = new EventEmitter();
const customDB = new CustomDB('./logs/');

export const getClient = (req, res) => {
    const { user_id, room_id, battle_id, hash } = req.query;
    const timestamp = moment.utc().format('X');

    if(battle_id && user_id && room_id) {
        // const hashMd5 = md5(game_id+':'+user_id+':'+room_id+':'+battle_id+':'+timestamp+':'+secret_key);

        // let data= {
        //     'game_id': game_id,
        //     'user_id': user_id,
        //     'room_id': room_id,
        //     'battle_id': battle_id,
        //     'hash': hashMd5,
        //     'timestamp': timestamp
        // }

        // axios.post('https://mindplays.com/api/v1/info_game', data)
        //     .then((res)=>{
        //         const responseData = res.data.data;
        //         const user = responseData.user;


        //     })

        res.render('client/index', {
            roomID: room_id,
            playerID: user_id,
            battleID: battle_id
        });
    } else {
        res.render('otherPages/error');
    }
}

export const joinOrCreateRoom = (ws, event) => {
    const obj = JSON.parse(event.data);
    const type = obj.type;
    const params = obj.params;
    
    ws.onmessage = null;

    if (type === MessageTypes.JOIN_OR_CREATE_ROOM) {
        const { playerID, battleID } = params;
        
        const targetRoom = rooms.get(battleID);
        console.log(MessageTypes.JOIN_OR_CREATE_ROOM)

        if (targetRoom) {
            console.log(`the room ${battleID} is already created!!!`);
            const targetPlayer = targetRoom.getPlayer(playerID);
            
            if (targetPlayer) {
                console.log(`the player ${playerID} is already in the game!!!`);
                targetRoom.updateDataPlayer(targetPlayer, ws);
            } else {
                const player = new Player(ws, playerID, targetRoom.emitter);

                if (targetRoom.isRoomFull()) {
                    console.log(`room ${battleID} is full`)
                } else {
                    targetRoom.addPlayer(player);
                    console.log(`player ${playerID} added successfully`);
                }

            }
        } else {
            const room = new Room(battleID, systemEmitter);
            console.log(`room ${battleID} created successfully!!!`);

            const player = new Player(ws, playerID, room.emitter);
            room.addPlayer(player);
            console.log(`player ${playerID} added successfully`);

            rooms.set(battleID, room);
        }
    }
}

const handleSubscription = (emitter) => {
    emitter.on(SystemEvents.ROOM_CLOSED, onRoomClosed);
}

const onRoomClosed = (room) => {
    const isDeletedRoom = rooms.delete(room.id);

    console.log(`room ${room.id} deleted status ${isDeletedRoom}`);
}

handleSubscription(systemEmitter);