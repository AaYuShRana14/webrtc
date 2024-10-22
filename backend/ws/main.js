const WebSocket = require('ws');
let rooms = {};
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  console.log('New user connected');

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      if (data.type === 'join') {
        handleroom(data.roomId,ws);
      }
      if(data.type==='offer'){
        handleoffer(data.offer,data.roomId,ws);
      }
      if(data.type==='ice'){
        handleice(data.ice,data.roomId,ws);
      }
      if(data.type==='answer'){
        handleanswer(data.answer,data.roomId,ws);
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });

  ws.on('close', () => {
    console.log('User disconnected');
    for (const room in rooms) {
      rooms[room] = rooms[room].filter(client => client !== ws);
      if (rooms[room].length === 0) {
        delete rooms[room];
      }
    }
  });
});
function handleroom(roomId,ws){
  if(rooms[roomId] && rooms[roomId].length>=2){
    ws.send(JSON.stringify({type:'room-full'}));
    return;
  }
  if (!rooms[roomId]) {
    rooms[roomId] = [];
  }
  rooms[roomId].push(ws);
  if(rooms[roomId].length===2)
  rooms[roomId].forEach(client => {
      client.send(JSON.stringify({ type: 'start-call', roomId }));
  });
}
function handleoffer(offer,roomId,ws){
  console.log('offer');
  let msg={"type":"offer",offer};
  broadCast(msg,roomId,ws);
}
function handleice(ice,roomId,ws){
  console.log('ice');
  let msg={"type":"ice",ice};
  broadCast(msg,roomId,ws);
}
function handleanswer(answer,roomId,ws){
  console.log('answer');
  let msg={"type":"answer",answer};
  broadCast(msg,roomId,ws);
}
function broadCast(msg,roomId,sender){
  console.log('broadcast');
  if(!rooms[roomId]) return;
  rooms[roomId].forEach(client=>{
    if(client!==sender && client.readyState===WebSocket.OPEN){
      client.send(JSON.stringify(msg));
    }
  })
}
console.log('WebSocket server is running on ws://localhost:8080');
