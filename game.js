const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingDiv = document.getElementById('loading');

// Esconder a mensagem de carregamento e mostrar o canvas
loadingDiv.style.display = 'none';
canvas.style.display = 'block';

// Configurações do jogo
const GRAVITY = 0.5;
const FLAP_SPEED = -8;
const PIPE_SPEED = 2;
const PIPE_GAP = 150; // Espaço vertical entre os canos
const PIPES_HORIZONTAL_DISTANCE = 250; // Distância horizontal entre pares de canos
const MIN_PIPE_HEIGHT = 50;
const MAX_PIPE_HEIGHT = 300;
const GLIDE_REDUCTION = 0.3; // Redução da gravidade para a planagem

// Estado do jogo
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = 0;
let lastPipeX = 0; // Controla a posição do último cano
let birdRotation = 0;
let backgroundOffset = 0;
let isGliding = false; // Estado da planagem

// Cores e gradientes
function createBirdGradient() {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
    gradient.addColorStop(0, '#90EE90');    // Verde claro
    gradient.addColorStop(0.5, '#32CD32');  // Verde lima
    gradient.addColorStop(1, '#228B22');    // Verde floresta
    return gradient;
}

function createPipeGradient(height, isTop) {
    const gradient = ctx.createLinearGradient(0, isTop ? height : 0, 0, isTop ? 0 : height);
    gradient.addColorStop(0, '#228B22');     // Verde floresta
    gradient.addColorStop(0.5, '#32CD32');   // Verde lima
    gradient.addColorStop(1, '#228B22');     // Verde floresta
    return gradient;
}

// Pássaro
const bird = {
    x: canvas.width / 3,
    y: canvas.height / 2,
    width: 30,
    height: 25,
    velocity: 0,
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotação do pássaro
        birdRotation = Math.max(-0.5, Math.min(Math.PI / 4, this.velocity * 0.05));
        ctx.rotate(birdRotation);
        
        // Corpo do pássaro
        ctx.fillStyle = createBirdGradient();
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Efeito de planagem (rastro verde suave)
        if (isGliding) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#90EE90';
            ctx.beginPath();
            ctx.ellipse(-10, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        // Olho
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupila
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(10, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bico
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(20, -2);
        ctx.lineTo(20, 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    },
    
    update() {
        if (gameStarted) {
            // Ativar planagem quando estiver caindo
            isGliding = this.velocity > 0;
            
            // Aplicar gravidade reduzida durante a planagem
            const currentGravity = isGliding ? GRAVITY - GLIDE_REDUCTION : GRAVITY;
            this.velocity += currentGravity;
            this.y += this.velocity;
        }
    },
    
    flap() {
        this.velocity = FLAP_SPEED;
    },
    
    reset() {
        this.y = canvas.height / 2;
        this.velocity = 0;
        birdRotation = 0;
    }
};

// Canos
let pipes = [];
class Pipe {
    constructor() {
        this.width = 52;
        this.gap = PIPE_GAP;
        this.x = canvas.width;
        this.topHeight = Math.random() * (canvas.height - this.gap - MIN_PIPE_HEIGHT * 2) + MIN_PIPE_HEIGHT;
        this.bottomY = this.topHeight + this.gap;
        this.passed = false;
    }
    
    draw() {
        // Cano superior
        const topGradient = createPipeGradient(this.topHeight, true);
        ctx.fillStyle = topGradient;
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        
        // Borda do cano superior
        ctx.fillStyle = '#006400';
        ctx.fillRect(this.x - 2, this.topHeight - 20, this.width + 4, 20);
        
        // Cano inferior
        const bottomHeight = canvas.height - this.bottomY;
        const bottomGradient = createPipeGradient(bottomHeight, false);
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(this.x, this.bottomY, this.width, bottomHeight);
        
        // Borda do cano inferior
        ctx.fillStyle = '#006400';
        ctx.fillRect(this.x - 2, this.bottomY, this.width + 4, 20);
    }
    
    update() {
        this.x -= PIPE_SPEED;
        
        // Verificar colisão
        if (!gameOver && gameStarted) {
            const birdRight = bird.x + bird.width / 2;
            const birdLeft = bird.x - bird.width / 2;
            const birdTop = bird.y - bird.height / 2;
            const birdBottom = bird.y + bird.height / 2;
            
            if (
                birdRight > this.x && 
                birdLeft < this.x + this.width && 
                (birdTop < this.topHeight || birdBottom > this.bottomY)
            ) {
                gameOver = true;
            }
            
            // Aumentar pontuação
            if (!this.passed && birdLeft > this.x + this.width) {
                score++;
                this.passed = true;
            }
        }
    }
}

// Funções do jogo
function spawnPipe() {
    if (gameStarted && !gameOver) {
        // Verifica se há espaço suficiente para um novo cano
        const lastPipe = pipes[pipes.length - 1];
        if (!lastPipe || canvas.width - lastPipe.x >= PIPES_HORIZONTAL_DISTANCE) {
            pipes.push(new Pipe());
        }
    }
}

function reset() {
    gameOver = false;
    gameStarted = false;
    pipes = [];
    lastPipeX = 0;
    bird.reset();
    if (score > highScore) {
        highScore = score;
    }
    score = 0;
}

function drawBackground() {
    // Céu gradiente
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');  // Azul céu claro
    skyGradient.addColorStop(1, '#4A90E2');  // Azul mais escuro
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Nuvens (movimento paralaxe)
    backgroundOffset = (backgroundOffset + 0.5) % canvas.width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
        let x = ((i * 200) - backgroundOffset) % canvas.width;
        if (x < 0) x += canvas.width;
        drawCloud(x, 50 + i * 30);
    }
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
    ctx.arc(x + 15, y + 10, 15, 0, Math.PI * 2);
    ctx.arc(x + 30, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

function drawScore() {
    // Sombra do texto
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Pontuação: ${score}`, 12, 32);
    ctx.fillText(`Recorde: ${highScore}`, 12, 62);
    
    // Texto principal
    ctx.fillStyle = 'white';
    ctx.fillText(`Pontuação: ${score}`, 10, 30);
    ctx.fillText(`Recorde: ${highScore}`, 10, 60);
    
    if (!gameStarted) {
        ctx.textAlign = 'center';
        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('Clique para começar', canvas.width/2 + 2, canvas.height/2 + 2);
        // Texto
        ctx.fillStyle = 'white';
        ctx.fillText('Clique para começar', canvas.width/2, canvas.height/2);
        ctx.textAlign = 'left';
    }
    
    if (gameOver) {
        ctx.textAlign = 'center';
        // Sombra do Game Over
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('Game Over', canvas.width/2 + 2, canvas.height/2 - 38);
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Clique para reiniciar', canvas.width/2 + 2, canvas.height/2 + 42);
        
        // Texto do Game Over
        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 40);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Clique para reiniciar', canvas.width/2, canvas.height/2 + 40);
        ctx.textAlign = 'left';
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    
    // Atualizar e desenhar canos
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
    pipes.forEach(pipe => {
        pipe.update();
        pipe.draw();
    });
    
    // Atualizar e desenhar pássaro
    bird.update();
    bird.draw();
    
    drawScore();
    
    requestAnimationFrame(gameLoop);
}

// Eventos
canvas.addEventListener('click', () => {
    if (gameOver) {
        reset();
    } else {
        if (!gameStarted) {
            gameStarted = true;
            setInterval(spawnPipe, 3000);
        }
        bird.flap();
    }
});

// Eventos para mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameOver) {
        reset();
    } else {
        if (!gameStarted) {
            gameStarted = true;
            setInterval(spawnPipe, 3000);
        }
        bird.flap();
    }
});

// Prevenir comportamentos padrão do navegador mobile
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Iniciar o jogo
gameLoop(); 