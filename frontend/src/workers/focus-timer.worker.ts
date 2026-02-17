let timer: number | null = null;

self.onmessage = (e) => {
    if (e.data.command === "start") {
        if (timer) {
            clearInterval(timer);
        }
        let timeLeft = e.data.duration;
        timer = self.setInterval(() => {
            timeLeft--;
            self.postMessage({ timeLeft });
            if (timeLeft === 0) {
                if(timer) {
                    clearInterval(timer);
                    timer = null;
                }
            }
        }, 1000);
    } else if (e.data.command === "stop") {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }
};
