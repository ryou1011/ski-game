class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.weatherCanvas = document.getElementById('weather-overlay');
        this.ctx = this.weatherCanvas.getContext('2d');
        this.weatherCanvas.width = window.innerWidth;
        this.weatherCanvas.height = window.innerHeight;
        this.particles = [];
        this.maxParticles = 200;
        this.weatherType = 'snow'; // 'snow', 'rain', etc.
    }

    update() {
        this.ctx.clearRect(0, 0, this.weatherCanvas.width, this.weatherCanvas.height);

        if (this.particles.length < this.maxParticles) {
            this.particles.push({
                x: Math.random() * this.weatherCanvas.width,
                y: -10,
                speedY: Math.random() * 1 + 1,
                speedX: Math.random() * 0.5 - 0.25,
                size: Math.random() * 2 + 1
            });
        }

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.particles.forEach((p, index) => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.y > this.weatherCanvas.height) {
                this.particles.splice(index, 1);
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}

export { WeatherSystem };
