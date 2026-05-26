import { openGame } from '../ui.js';
import { addTickets } from '../economy.js';

export function startPinball(){

    openGame('Pinball');

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    let ball = {
        x:400,
        y:100,
        vx:6,
        vy:2,
        radius:15
    };

    const bumpers = [
        {x:300,y:250,r:40},
        {x:600,y:350,r:40},
        {x:500,y:500,r:50}
    ];

    function draw(){

        ctx.clearRect(0,0,canvas.width,canvas.height);

        ball.x += ball.vx;
        ball.y += ball.vy;

        ball.vy += 0.2;

        if(ball.x < 0 || ball.x > canvas.width){

            ball.vx *= -1;
        }

        if(ball.y < 0){

            ball.vy *= -1;
        }

        if(ball.y > canvas.height){

            addTickets(25);

            ball.y = 100;
        }

        bumpers.forEach(b => {

            ctx.beginPath();

            ctx.arc(
                b.x,
                b.y,
                b.r,
                0,
                Math.PI*2
            );

            ctx.fillStyle='cyan';
            ctx.shadowBlur=30;
            ctx.shadowColor='cyan';

            ctx.fill();

            const dx = ball.x - b.x;
            const dy = ball.y - b.y;

            const dist = Math.hypot(dx,dy);

            if(dist < ball.radius + b.r){

                ball.vx *= -1;
                ball.vy *= -1;

                addTickets(5);
            }
        });

        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            ball.radius,
            0,
            Math.PI*2
        );

        ctx.fillStyle='white';
        ctx.fill();

        requestAnimationFrame(draw);
    }

    draw();
}
