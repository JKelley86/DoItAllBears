import { openGame } from '../ui.js';
import { addTickets } from '../economy.js';

export function startWheelGame(){

    openGame('Spin The Wheel');

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const prizes = [20,50,100,200,500];

    let angle = 0;
    let velocity = 0;
    let spinning = false;

    canvas.onclick = () => {

        if(spinning) return;

        spinning = true;
        velocity = Math.random()*0.35 + 0.35;
    };

    function draw(){

        ctx.clearRect(0,0,canvas.width,canvas.height);

        const cx = canvas.width/2;
        const cy = canvas.height/2;

        ctx.save();

        ctx.translate(cx,cy);
        ctx.rotate(angle);

        for(let i=0;i<prizes.length;i++){

            const slice = Math.PI*2/prizes.length;

            ctx.beginPath();
            ctx.moveTo(0,0);

            ctx.arc(
                0,
                0,
                260,
                i*slice,
                (i+1)*slice
            );

            ctx.fillStyle =
                i%2 ? '#00ffff' : '#ff00ff';

            ctx.fill();

            ctx.save();

            ctx.rotate(i*slice + slice/2);

            ctx.fillStyle='white';
            ctx.font='28px Orbitron';

            ctx.fillText(prizes[i],140,0);

            ctx.restore();
        }

        ctx.restore();

        angle += velocity;

        if(spinning){

            velocity *= 0.992;

            if(velocity < 0.002){

                spinning = false;

                const won =
                    prizes[
                        Math.floor(
                            Math.random()*prizes.length
                        )
                    ];

                addTickets(won);
            }
        }

        requestAnimationFrame(draw);
    }

    draw();
}
